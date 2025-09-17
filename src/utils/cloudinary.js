import {v2 as cloudinary} from "cloudinary";
import fs from "fs";   // Importing the file system module to handle file operations

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // This will automatically detect the file type (image, video, etc.)
        });

        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", result.url);
        return result;


    } catch (error) {
        fs.unlinkSync(localFilePath); // Delete the local file in case of an error
        return null;
    }
}


export {uploadOnCloudinary};
