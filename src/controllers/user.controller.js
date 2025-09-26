import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import  { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import jwt from "jsonwebtoken";

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






export {   
     registerUser, 
     loginUser,
     logoutUser,
     refreshAccessToken
       };







