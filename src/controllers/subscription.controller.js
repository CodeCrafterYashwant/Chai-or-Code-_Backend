import mongoose, { isValidObjectId, Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { subscribe } from "diagnostics_channel";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel Not Found.");
    }
    const user = req.user;
    if (channelId == user._id) {
        throw new ApiError(403, "You can not subscribe your own channel.");
    }
    const existingSubscription = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId,
    });
    if (!existingSubscription) {
        const createdSubscription = await Subscription.create({
            subscriber: user._id,
            channel: channelId,
        });
        return res
            .status(200)
            .json(
                new ApiResponse(200, createdSubscription, "Channel Subscribed.")
            );
    } else {
        await Subscription.deleteOne({
            subscriber: user._id,
            channel: channelId,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Channel Unsubscribed."));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel Not Found.");
    }
    const user = req.user;
    if (user._id != channelId) {
        throw new ApiError(401, "You are not owner of this channel.");
    }
    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                let: { subscriber_id: "$subscriber" },

                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$subscriber_id"] },
                        },
                    },
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
                as: "subscriberDetails",
            },
        },

        {
            $unwind: "$subscriberDetails",
        },
        {
            $project: {
                _id: 0,
                fullName: "$subscriberDetails.fullName",
                username: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar",
                subscribedAt: "$createdAt",
            },
        },
    ]);
    if (subscriber.length === 0) {
        throw new ApiError(404, "No Subscriber");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, subscriber, "Subscriber List Featched"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: userId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "Channels",
            },
        },
        {
            $unwind: "$Channels",
        },
        {
            $project: {
                _id: 0, // Hide the subscription's default _id
                subscriptionId: "$_id",
                ChannelId: "$channel",
                ChannelName: "$Channels.username",
                avatar: "$Channels.avatar",
                coverImage: "$Channels.coverImage",
                subscribedAt: "$createdAt",
            },
        },
    ]);
    if (channels.length === 0) {
        throw new ApiError(404, "You have not subscribed any channels Yet.");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channels, "Subscribed Channels Featched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
