import mongoose, { isValidObjectId, Types } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinaryByUrl,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // 1. Build the $match stage conditions
    const pipeline = [];
    const matchConditions = {};

    // Filter by text search query (title or description)
    if (query) {
        matchConditions.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    // Filter by a specific owner/user if provided
    if (userId) {
        matchConditions.owner = new Types.ObjectId(userId);
    }

    // Push the match stage if any conditions exist
    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // 2. Build the $sort stage
    const sortCriteria = {};
    const sortOrder = sortType === "asc" ? 1 : -1;
    sortCriteria[sortBy] = sortOrder;

    pipeline.push({ $sort: sortCriteria });

    // 3. Pagination stages ($skip and $limit)
    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skipCount = (pageNumber - 1) * pageSize;

    pipeline.push({ $skip: skipCount }, { $limit: pageSize });

    // 4. Lookup video owner details from the users collection
    pipeline.push(
        {
            $match: {
                isPublished: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        // 5. Clean up the final projected output
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1,
            },
        }
    );

    // Execute the aggregation pipeline
    const videos = await Video.aggregate(pipeline);

    if (videos.length === 0) {
        throw new ApiError(404, "No Videos Found.");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required.");
    }
    if (!req.files || !req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video or Thumbnail file are missing.");
    }
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;
    const video = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!video || !thumbnail) {
        throw new ApiError(400, "Failed to upload files.");
    }
    const UploadedVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnail.secure_url,
        videoFile: video.secure_url,
        duration: video.duration,
        isPublished: true,
        owner: req.user?._id,
    });
    return res
        .status(201)
        .json(
            new ApiResponse(201, UploadedVideo, "Video uploaded successfully.")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user;
    if (!videoId || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required.");
    }
    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (!video) {
        throw new ApiError(404, "Video not Found.");
    }
    const isOwner = user && video.owner._id.toString() === user._id.toString();
    if (!video.isPublished && !isOwner) {
        throw new ApiError(403, "Video is not published yet.");
    }
    if (!isOwner) {
        await Video.findByIdAndUpdate(videoId, {
            $inc: { views: 1 }
        });
        video.views += 1; 
    }
    if (user) {
        await User.findByIdAndUpdate(
            user._id,
            {
                $addToSet: {
                    watchHistory: videoId,
                },
            }
        );
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video Featched Successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required.");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found or Invalid Video Id.");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video.");
    }
    if (video.isPublished === false) {
        throw new ApiError(
            403,
            "Video is not published yet. You can only update published videos."
        );
    }
    const { title, description } = req.body || {};
    const thumbnail = req.file;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail.path;
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No changes found.");
    }
    if ("title" in updateData && updateData.title !== video.title) {
        video.title = updateData.title;
    }
    if (
        "description" in updateData &&
        updateData.description !== video.description
    ) {
        video.description = updateData.description;
    }

    if ("thumbnail" in updateData) {
        if (await deleteFromCloudinaryByUrl(video.thumbnail)) {
            console.log("Thumbnail Deleted From Cloudinary.");
        }
        const thumbnailUrl = await uploadOnCloudinary(updateData.thumbnail);
        if (!thumbnail) {
            throw new ApiError(400, "Error while uploading.");
        }
        video.thumbnail = thumbnailUrl.secure_url;
    }
    const updatedData = await video.save();
    return res
        .status(200)
        .json(new ApiResponse(200, updatedData, "Video details Updated."));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required.");
    }
    const videoOwner = await Video.findById(videoId).select("owner");

    if (videoOwner.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video.");
    }
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        throw new ApiError(404, "Video not Found.");
    }
    const deleteImage = await deleteFromCloudinaryByUrl(video?.videoFile);
    const deleteVideo = await deleteFromCloudinaryByUrl(video?.thumbnail);
    if (
        deleteImage &&
        deleteImage.result === "ok" &&
        deleteVideo &&
        deleteVideo.result === "ok"
    ) {
        console.log("Video related files deleted from Cloudinary.");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video Deleted Successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required.");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not Found.");
    }
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video.");
    }
    if (video.isPublished === true) {
        video.isPublished = false;
    } else if (video.isPublished === false) {
        video.isPublished = true;
    }
    const result = await video.save({ validation: false });
    if (!result) {
        throw new ApiError(400, "Error while changing status of video.");
    }
    return res.status(200).json(new ApiResponse(200, result, "Video Toggled."));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
