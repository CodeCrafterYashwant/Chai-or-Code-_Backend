import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) =>{
    //get user details from frontend
    //validation --not empty
    //check if user is already exists check with username and email
    //check for images ,check for avtar
    //upload them to cloudnary ,check avtar
    //create user object
    //create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return response

    const {email,username,fullName,password} = req.body
    console.log("email: ",email);
    // if (fullName === "") {
    //     throw new ApiError(400,"Full Name is required")
    // }
    if (
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = User.findOne({
        $or:[{username},{email}]
    })
    if (existedUser){
        throw new ApiError(409,"User with username and email alread exist")
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar File is Required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        email,
        username:username.toLowerCase(),
        coverImage:coverImage?.url || "",
        password
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registoring user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})


export {registerUser}