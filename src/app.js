import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use mostly used when we want to set up some global middleware for our application //always when writing or using a middleware
// Middleware setup
// app.use => wheneever there's middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));



// Body parsing middlewares written below
app.use(express.json({limit: "16kb"})); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" }));  // to support URL-encoded bodies
app.use(express.static("public")); // to support static files
app.use(cookieParser());  // to support cookie parsing


//routes import
import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/users", userRoutes);  // whenever we hit /users it will go to userRoutes



export  {app};