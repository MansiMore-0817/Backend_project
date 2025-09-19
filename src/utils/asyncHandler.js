// ApiResponse → Shapes the "good news" (success).
// ApiError → Shapes the "bad news" (errors).
// asyncHandler → Makes sure errors from async functions don’t crash your app and are passed properly to ApiError.



import e from "express";

const asyncHandler = (requestHandler) => {
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((error)=>next(error));
    } 
};




export { asyncHandler };

// const asyncHandler = (func) => async (req, res, next)=> {
//     try{
//         await func(req, res, next);
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Internal Server Error",
//         })
//     }
// };
