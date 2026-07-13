import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinaryByUrl,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import jwt from "jsonwebtoken";

const uploadVideo = asyncHandler(async (req, res) => {
    const { tittle, description } = req.body;
    if (!tittle || !description) {
        throw new ApiError(400, "Provide tittle or description");
    }
    const user = req.user?._id;
    const video = req.files?.video;
    const thumbnail = req.files?.thumbnail;
    if (!video || !thumbnail) {
        throw new ApiError(400, "video or thumbnail is missing.");
    }
    const videoLocalPath = video[0]?.path;
    const thumbnailLocalPath = thumbnail[0]?.path;
    // const videoCloudinary = await uploadOnCloudinary(videoLocalPath)
    // const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath)
    const [videoCloudinary, thumbnailCloudinary] = await Promise.allSettled([
        uploadOnCloudinary(videoLocalPath),
        uploadOnCloudinary(thumbnailLocalPath),
    ]);
    if (!videoCloudinary) {
        throw new ApiError(400, "Video is required");
    }
    if (!thumbnailCloudinary) {
        throw new ApiError(400, "Thumbnail is required");
    }
    const videoLive = await Video.create({
        videoFile: videoCloudinary.value.url,
        thumbnail: thumbnailCloudinary.value.url,
        tittle: tittle,
        description: description,
        duration: videoCloudinary.value.duration,
        owner: user,
    });
    return res
        .status(201)
        .json(new ApiResponse(200, videoLive, "Video uploaded successfully."));
});

const getVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format");
    }
    let isSubscribed;
    const cookie = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!cookie) {
        console.log("No cookie");
        const video = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            {
                $unwind: "$ownerDetails",
            },
            {
                $project: {
                    "ownerDetails.refreshToken": 0,
                    "ownerDetails.password": 0,
                    "ownerDetails.watchHistory": 0,
                    "ownerDetails.updatedAt": 0,
                    "ownerDetails.email": 0,
                    owner: 0,
                },
            },
        ]);
        if (!video) {
            throw new ApiError(400, "Video not found");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    video[0],
                    "Video Details featched successfully."
                )
            );
    }
    const decodedToken = jwt.verify(cookie, process.env.REFRESH_TOKEN_SECRET);
    const userId = await User.findById(decodedToken?._id);
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        {
            $unwind: "$ownerDetails",
        },
        {
            $project: {
                "ownerDetails.refreshToken": 0,
                "ownerDetails.password": 0,
                "ownerDetails.watchHistory": 0,
                "ownerDetails.updatedAt": 0,
                "ownerDetails.email": 0,
                owner: 0,
            },
        },
    ]);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }
    const user = await Subscription.findOne({
        subscriber: userId,
        channel: video[0].ownerDetails._id,
    });
    if (user) {
        isSubscribed = true;
    } else {
        isSubscribed = false;
    }
    Object.assign(video[0], { isSubscribed: isSubscribed });
    console.log(video[0], typeof video[0]);
    // const video = await Video.findById(videoId)
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "Video Details featched successfully."
            )
        );
});

export { uploadVideo, getVideoDetails };
