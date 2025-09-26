import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


// multer middleware for handling file uploads
// using upload middleware before registerUser controller for handling file uploads
router.route("/register").post( 
  // multer middleware for handling file uploads
  upload.fields([   //fields means multiple files
    { 
        name: "avatar",
        maxCount: 1
    },
    { 
        name: "coverImage",
        maxCount: 1
    }
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);


export default router;
