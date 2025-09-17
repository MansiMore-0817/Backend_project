import multer from "multer";

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Specify the destination directory for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name given by user
    }
})

export const upload = multer({
    storage: storage   // Configure multer to use the defined storage
});