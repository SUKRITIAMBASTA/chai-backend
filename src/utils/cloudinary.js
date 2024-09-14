import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully
        console.log("File uploaded to Cloudinary:", response.url);
       fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);

        // Only attempt to unlink the file if it exists
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log("Local file removed after failed upload");
            } catch (unlinkError) {
                console.error("Error removing local file:", unlinkError);
            }
        }
        
        return null;
    }
};

export { uploadOnCloudinary };


// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"

//     cloudinary.config({ 
//         cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
//         api_key:process.env.CLOUDINARY_API_KEY, 
//         api_secret:process.env.CLOUDINARY_API_SECRET
//     });
// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null
//         //upload on cloudinary
//        const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type:"auto"
//         })
//         //file has been uploaded successfully
//        console.log("file is uploaded on cloudinary",
//        response.url);
//        return response;
//     } catch (error) {
//         fs.unlinkSync(localFilePath)/*removes the locally saved temp file 
//         when upload operation fails*/
//         return null;
//     }
// }
// export{uploadOnCloudinary}