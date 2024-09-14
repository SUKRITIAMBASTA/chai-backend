const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
      // Use the native JavaScript Promise
      Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
  };
  
  export { asyncHandler };
  


// import pkg from "mongoose";
// const {Promise} = pkg;

// const asyncHandler = (requestHandler) =>{
//    return (req,res,next)=>{
//         Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
//     }
// }
// export{asyncHandler}

// const asyncHandler = (fn)=>async(req,res,next)=>{
//     try{
//     await fn(req,res,next)
//     }catch(error){
//         res.status(err.code||500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }