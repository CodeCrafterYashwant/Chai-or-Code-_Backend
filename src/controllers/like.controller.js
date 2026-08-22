import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid Video Id.')
    }
    const validVideo = await Video.findById(videoId)
    if(!validVideo){
        throw new ApiError(404,'Video not Found.')
    }
    const excistingLike = await Like.findOne({
        video:videoId,
        likeBy:req.user?._id
    })
    if(!excistingLike){
        const newLike = await Like.create({
            video:videoId,
            likeBy:req.user?._id
        })
        return res.status(201).json(
            new ApiResponse(201,newLike,'Video liked successfully.')
        )
    }
    await Like.findByIdAndDelete(excistingLike._id)
    return res.status(200).json(
        new ApiResponse(200,'Video unliked successfully')
    )
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    if(!commentId || !mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,'Invalid Comment Id.')
    }
    const validComment = await Comment.findById(commentId)
    if(!validComment){
        throw new ApiError(404,'Comment not Found.')
    }
    const excistingLike = await Like.findOne({
        comment:commentId,
        likeBy:req.user?._id
    })
    if(!excistingLike){
        const newLike = await Like.create({
            comment:commentId,
            likeBy:req.user?._id
        })
        return res.status(201).json(
            new ApiResponse(201,newLike,'Comment liked successfully.')
        )
    }
    await Like.findByIdAndDelete(excistingLike._id)
    return res.status(200).json(
        new ApiResponse(200,'Comment unliked successfully')
    )
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    if(!tweetId || !mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400,'Invalid Tweet Id.')
    }
    const validTweet = await Tweet.findById(tweetId)
    if(!validTweet){
        throw new ApiError(404,'Tweet not Found.')
    }
    const excistingLike = await Like.findOne({
        tweet:tweetId,
        likeBy:req.user?._id
    })
    if(!excistingLike){
        const newLike = await Like.create({
            tweet:tweetId,
            likeBy:req.user?._id
        })
        return res.status(201).json(
            new ApiResponse(201,newLike,'Tweet liked successfully.')
        )
    }
    await Like.findByIdAndDelete(excistingLike._id)
    return res.status(200).json(
        new ApiResponse(200,'Tweet unliked successfully')
    )
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
