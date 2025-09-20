// import {v2 as cloudinary} from "cloudinary";
// import fs from "fs";   // Importing the file system module to handle file operations

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null;

//         // Upload the file to Cloudinary
//         const result = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto", // This will automatically detect the file type (image, video, etc.)
//         });

//         //file has been uploaded successfully
//         console.log("file is uploaded on cloudinary", result.url);
//         return result;


//     } catch (error) {
//         fs.unlinkSync(localFilePath); // Delete the local file in case of an error
//         return null;
//     }
// }


// export {uploadOnCloudinary};







// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//       folder: "users", // optional: group all uploads in a folder
//     });

//     console.log("✅ File uploaded to Cloudinary:", result.secure_url);

//     // Cleanup: remove local file
//     fs.unlink(localFilePath, (err) => {
//       if (err) console.warn("⚠️ Failed to delete local file:", err.message);
//     });

//     return result;
//   } catch (error) {
//     console.error("❌ Cloudinary upload error:", error);

//     // Cleanup if upload fails
//     if (fs.existsSync(localFilePath)) {
//       fs.unlink(localFilePath, (err) => {
//         if (err) console.warn("⚠️ Failed to delete local file:", err.message);
//       });
//     }

//     return null;
//   }
// };

// export { uploadOnCloudinary };






import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  // Configure Cloudinary here, dynamically
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "users",
    });

    //console.log("✅ File uploaded to Cloudinary:", result.secure_url);

    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) console.warn("⚠️ Failed to delete local file:", err.message);
      });
    }

    return null;
  }
};

export { uploadOnCloudinary };
