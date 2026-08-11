import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id;
    const videos = await Video.find({
        owner: channelId,
    }).sort({ createdAt: -1 });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                videos.length === 0
                    ? "Channel has no Video Yet."
                    : "All videos of Channel Feacthed Successfully."
            )
        );
});

export { getChannelStats, getChannelVideos };
