import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  // Check for missing fields
  if ([fullName, email, username, password].some((field) => !field.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or Username already exists");
  }

  // Handle file paths and uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Check for avatar file
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload files to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar file");
  }

  try {
    // Create user
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    });

    // Retrieve created user excluding sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
      throw new ApiError(500, "User not found after creation");
    }

    // Respond with success
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("Error during user registration:", error);
    throw new ApiError(500, "Something went wrong while registering");
  }
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

 const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Check if the user is present in the request
  if (!req.user || !req.user._id) {
      console.log("User from req.user:", req.user); // Debugging statement
      throw new ApiError(401, "User not authorized");
  }

  // Clear the refreshToken field for the user
  await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshToken: undefined }
  });

  // Define options for cookie clearing
  const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure flag should be true in production
  };

  // Clear cookies and send response
  return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser 
  };