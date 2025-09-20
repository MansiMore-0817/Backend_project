import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



const userSchema = new Schema(
    {
       username : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true   //used for faster search when we have large database
       },
       email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
       },
       fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
       },
       avatar: {
        type: String,   //cloudinary url used to store image
        required: true
       },
       coverImage: {
        type: String,   //cloudinary url used to store image
       },
       watchHistory : [
        {
            type: Schema.Types.ObjectId,    //mongoose schema type
            ref: "Video" // reference to Video model   (we always write ref after mongoose schema type i.e the line above)
        }
       ],
       password: {
        type: String,
        required: [ true, "Password is required" ]
       },
       refreshToken: {
        type: String
       }

     },
        { timestamps: true }  //createdAt, updatedAt fields will be added automatically by mongoose
);


userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);  //10 is salt rounds
    next();
});

userSchema.methods.isPasswordCorrect = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);   //returns true or false
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}
userSchema.methods.generateRefreshToken = function() {
    jwt.sign({
        _id: this._id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}



export const User = mongoose.model("User", userSchema);