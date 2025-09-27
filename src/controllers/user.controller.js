import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import  { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { watch } from "fs";

// Controller function to handle user registration

const generateAccessAndRefreshTokens = async(userId)=> {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();


        user.refreshToken = refreshToken;
       await  user.save({validateBeforeSave: false});    


       return {accessToken, refreshToken};

    }
    catch(error){
        throw new ApiError(500, "something went wrong while generating refresh and access tokens");
    }
}



const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "mansi more"
    // })

    // getting user info like username email password from frontend
    // checking validation of user info whether it already exists or not (in backend)
    // check if user already exists
    // if exists then throw error
    // if not exists then
    // create a new user instance
    // check for images, avatars
    // uploading images, avatars to cloudinary
    // get the url of uploaded image
    // add the url to user object
    // hash the password (bcryptjs)
    // save the user object to database (mongodb)
    // remove password and refresh token field from user object before sending response

    // send success response to frontend


   const { fullName,  username, email, password, avatar, coverImage } = req.body;  //destructuring
    console.log(email);



    // can use this for beginners
    // if(fullName === " ") {
    //     throw new ApiError(400, "Full name is required");
    // }
   
                // OR
    
    if(
        [fullName, username, email, password].some((field)=> 
            field?.trim() === ""
        )
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({   
        $or: [{ email }, { username }]
     })   //checking if user already exists


    if(existedUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }
     

    console.log("req.body:", req.body);
    console.log("req.files:", req.files);


    //req.body given by frontend that is by express.json() middleware and req.files given by multer middleware
    const avatarLocalPath = req.files?.avatar[0]?.path ? path.resolve(req.files.avatar[0].path).replace(/\\/g, "/") : undefined;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path ? path.resolve(req.files.coverImage[0].path).replace(/\\/g, "/") : undefined;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }



    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // if(!coverImageLocalPath) {
    //     throw new ApiError(400, "Cover image is required");
    // }


    // upload avatar to cloudinary
    const avatarUploadResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUploadResponse = await uploadOnCloudinary(coverImageLocalPath);


    console.log("req.files:", req.files);
    console.log("avatarLocalPath:", avatarLocalPath);
    
    if(!avatarUploadResponse) {
        throw new ApiError(500, "Could not upload avatar. Please try again later.");
    }

    // if(!coverImageUploadResponse) {
    //     throw new ApiError(500, "Could not upload cover image. Please try again later.");
    // }

    const user = await User.create({
        fullName,
        avatar: avatarUploadResponse.url,
        coverImage: coverImageUploadResponse?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken -__v"); //excluding password and refreshToken field from the response



    if(!createdUser) {
        throw new ApiError(500, "User could not be created. Please try again later.");
    }


    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )

});




const loginUser = asyncHandler(async (req, res) => {
        // login functionality will be implemented here
        // get data from req.body
        // username based on email based login(decide any one but we will write code for both)
        //find the user 
        // check password
        // generate access and refresh token
        // send this tokens in form of cookies
        


        const {email, username, password} = req.body;


        if(!email && !username){    
            throw new ApiError(400, "Email or username is required");
        }

        //the alternative of above code can also be written as following
        // if(!(email || username)){    
        //     throw new ApiError(400, "Email or username is required");
        // }

        const user = await User.findOne({
             $or: [{email}, {username}]
             })   //checking if user already exists
        

        if(!user) {
            throw new ApiError(404, "User not found with this email or username");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);  //method from user model


        if(!isPasswordValid){
            throw new ApiError(401, "Invalid password");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);



        //this is the optional step
        const loggedInUser = await User.findById(user._id).
        select("-password  -refreshToken")




        const options = {
            httpOnly: true,
            secure: true
        }


        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        );

})



const logoutUser = asyncHandler(async (req, res) => {
    // to logout first we need to clear the cookies
    //we need to design our own middleware here as we can't access any user here...the user is only accessible
    // in the login user function
    // Here, the middleware we created is auth.middleware.js
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined   //
            }
        },
        {
            new: true
        }
    )


    const options = {
            httpOnly: true,
            secure: true
        }


       return res
       .status(200)
       .clearCookie("accessToken", options) 
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "User logged out"))

})


const refreshAccessToken = asyncHandler(async(req, res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }


    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
    
        )
    
       const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
       
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token Is Expired Or Used");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }

})


const changeCurrentPassword = asyncHandler(async(req, res)=> {
    const {oldPassword, newPassword }= req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});


    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));

})



//to fetch or get the current user
const getCurrUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
})


const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "All fields required");
    }


    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
            fullName: fullName,
            email: email
        }
      },
      {new: true}
    ).select("-password")



    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
})


const updateUserAvatar = asyncHandler(async(req, res)=> {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading file");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async(req, res)=> {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading file");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
})



const getUserChannelProfile = asyncHandler(async(req, res)=> {
        // when we want the profile of any channel we get it by the channel's url or link or @
        // that's why we do use "params" here
        const {username}  = req.params;

        if(!username?.trim()){
            throw new ApiError(400, "username is missing");
        }

        // aggregation pipelines
        // We get arrays as a result of aggregation pipelines
        // The aggregation starts with the User collection.
        // $match filters the documents to only include the one where username matches the input username (converted to lowercase).
        // The result is an array of documents that match.


        const channel = await User.aggregate(
            [
                {
                    $match: {
                        username: username?.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",  //here, "Subscription" model is used but in pipeline it converts to "subscriptions" i.e. lowercase and plural
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",  //here, "Subscription" model is used but in pipeline it converts to "subscriptions" i.e. lowercase and plural
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribedTo"
                    }
                },
                {
                    $addFields:{
                        subscribersCount: {
                            $size: "$subscribers"
                        },
                        channelsSubscribedToCount: {
                            $size: "$subscribedTo"
                        },
                        isSubscribed: {
                            $cond: {
                                if: {
                                    $in: [req.user?._id, "$subscribers.subscriber"]
                                },
                                then: true,
                                else: false
                            }
                        }

                        
                    }
                },
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        subscribersCount: 1,
                        channelsSubscribedToCount: 1,
                        isSubscribed: 1,
                        avatar: 1,
                        coverImage: 1,
                        email: 1
                    }
                }
            ]
        )
   


        if(!channel?.length){
            throw new ApiError(404,"Channel doesn't exist");
        }



        return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})



const getWatchHistory = asyncHandler(async(req, res)=> {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})



export {   
     registerUser, 
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile
       };







