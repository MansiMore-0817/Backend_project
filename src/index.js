// require("dotenv").config({path: "./.env"});
import dotenv from "dotenv";

// import express from "express";
// const app = express();
import { app } from "./app.js"; // Import the configured app


import connectDB from "./db/index.js";

dotenv.config({ path: "./.env" });   //must line


//Database connection and server start
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((err)=>{
    console.log("MongoDb connection failed!!!", err);
});


/*
//Database connection and server start
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error", (error)=> {

            console.error("Error connecting to the database", error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }
    catch(error){
        console.error("Error connecting to the database", error)
        throw error
    }
})
(); */