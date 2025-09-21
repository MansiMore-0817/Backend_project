import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import  {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";

// Controller function to handle user registration


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

export { registerUser };







