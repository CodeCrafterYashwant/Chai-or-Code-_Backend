import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const subscribeToChannel = asyncHandler(async (req, res) => {
    const { channel_Id } = req.params;
    const subscriber = req.user?._id;
    if (!channel_Id) {
        throw new ApiError(400, "Channel Id does not provided");
    }
    if (!subscriber) {
        throw new ApiError(400, "Please login to subscribe channel");
    }
    if (channel_Id.trim() === subscriber.toString()) {
        throw new ApiError(401, "You cannot subscribe your own channel");
    }
    const channelExist = await User.findById(channel_Id);
    if (!channelExist) {
        throw new ApiError(
            404,
            "The channel you are trying to subscribe to does not exist."
        );
    }
    const is_Subscribed = await Subscription.exists({
        subscriber: subscriber,
        channel: channel_Id,
    });
    if (is_Subscribed) {
        throw new ApiError(409, "You have already subscribed to this channel");
    }
    const response = await Subscription.create({
        subscriber: subscriber,
        channel: channel_Id,
    });
    return res
        .status(201)
        .json(
            new ApiResponse(201, response, "Channel subscribed successfully")
        );
});

const unsubscribeChannel = asyncHandler(async (req, res) => {
    const { channel_Id } = req.params;
    const subscriber = req.user?._id;
    if (!channel_Id) {
        throw new ApiError(400, "Channel Id not provided ");
    }
    if (!subscriber) {
        throw new ApiError(400, "Please login to unsubscribe channel");
    }
    if (channel_Id.trim() === subscriber.toString()) {
        throw new ApiError(401, "You cannot unsubscribe your own channel");
    }
    const channelExist = await User.findById(channel_Id);
    if (!channelExist) {
        throw new ApiError(
            404,
            "The channel you are trying to unsubscribe to does not exist."
        );
    }
    const is_Subscribed = await Subscription.exists({
        subscriber: subscriber,
        channel: channel_Id,
    });
    if (!is_Subscribed) {
        throw new ApiError(
            409,
            "You have not subscribed to this channel therefore you cannot unsubscribe channel"
        );
    }
    const response = await Subscription.findByIdAndDelete(is_Subscribed._id);
    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Channel unsubscribed successfully")
        );
});

export { subscribeToChannel, unsubscribeChannel };
