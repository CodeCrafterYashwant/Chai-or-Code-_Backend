import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    const createdTweet = await Tweet.create({
        content,
        owner: userId,
    });
    if (!createdTweet) {
        throw new ApiError(500, "Unable to create tweet right now.");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Enter valid user id.");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(400, "User not Found.");
    }
    const tweets = await Tweet.find({
        owner: userId,
    }).sort({ createdAt: -1 });
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets Fetched Successfully."));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Enter valid tweet ID.");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "Tweet not Found.");
    }
    if (req.user?._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(403, "You are not allowed to change others tweet.");
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated."));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Enter Valid Tweet ID.");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "Tweet not Found.");
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "You are not allowed to deleted others tweets."
        );
    }
    await Tweet.findByIdAndDelete(tweetId);
    return res.status(200).json(new ApiResponse(200, "Tweet Deleted."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
