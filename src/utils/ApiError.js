class ApiError extends Error {  
    constructor(
        statusCode,
        messsage= "Something went wrong",
        errors =[],
        stack= ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = null;
        this.message = messsage;
        this.success = false;

        if(stack){
        this.stack = stack;
    }
    else{
        Error.captureStackTrace(this, this.constructor);
    }
    }
}
export { ApiError};