import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Extract token from Authorization header or cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Extracted Token:", token); // Debugging statement

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        // Verify and decode token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded Token:", decodedToken); // Debugging statement

        // Retrieve user from database
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        console.log("User Found:", user); // Debugging statement

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message); // Debugging log
        throw new ApiError(401, error.message || "Invalid access token");
    }
});


