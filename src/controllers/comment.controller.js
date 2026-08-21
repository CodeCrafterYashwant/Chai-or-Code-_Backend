import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID.");
    }
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1,
            },
        },
    ];

    const aggregateQuery = Comment.aggregate(pipeline);
    const comments = await Comment.aggregatePaginate(aggregateQuery, options);
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID.");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required.");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not Found.");
    }
    const comment = await Comment.create({
        video: videoId,
        owner: req.user?._id,
        content: content.trim(),
    });
    if (!comment) {
        throw new ApiError(500, "Failed to add the comment. Please try again.");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment Succesfully added."));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID.");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required.");
    }
    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id: commentId,
            owner: req.user?._id,
        },
        {
            $set: {
                content: content.trim(),
            },
        },
        { new: true }
    );
    if (!updatedComment) {
        throw new ApiError(
            403,
            "Either comment not exist or you are not owner of this comment"
        );
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment Updated Succesfully.")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID.");
    }
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user?._id,
    });
    if (!deletedComment) {
        throw new ApiError(
            403,
            "You are not owner of this comment or comment not exist"
        );
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedComment,
                "Comment deleted Successfully."
            )
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
