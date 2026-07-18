import mongoose, {isValidObjectId, Types} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { subscribe } from "diagnostics_channel"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel ID is required")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404,'Channel Not Found.')
    }
    const user = req.user 
    if (channelId == user._id) {
        throw new ApiError(403,"You can not subscribe your own channel.")
    }
    const existingSubscription = await Subscription.findOne(
        {
            subscriber:user._id,
            channel:channelId
        }
    )
    if (!existingSubscription) {
        const createdSubscription = await Subscription.create(
           {
                subscriber:user._id,
                channel:channelId
            }
        )
        return res.status(200).json(
            new ApiResponse(200,createdSubscription,'Channel Subscribed.')
        )
    }else{
        await Subscription.deleteOne(
            {
                subscriber:user._id,
                channel:channelId
            }
        )
        return res.status(200).json(
            new ApiResponse(200,{},'Channel Unsubscribed.')
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel ID is required")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404,'Channel Not Found.')
    }
    const user = req.user
    if (user._id != channelId) {
        throw new ApiError(401,"You are not owner of this channel.")
    }
    const subscriber = await Subscription.aggregate([
        {
        $match: {
            channel: new Types.ObjectId(channelId)
        }
    },
    // Stage 2: The Sub-Aggregation Lookup
    {
        $lookup: {
            from: "users", // MongoDB automatically names the collection 'users' (lowercase, plural)
            let: { subscriber_id: "$subscriber" }, // Define a variable from the Subscription doc
            
            // This is the sub-pipeline running on the "users" collection
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$_id", "$$subscriber_id"] }
                    }
                },
                // Project ONLY the fields you want from the User model! 
                // This saves memory and keeps passwords/emails secure.
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ],
            as: "subscriberDetails"
        }
    },
    // Stage 3: Unwind (flatten) the array
    // $lookup always outputs an array. Since one subscription matches exactly one user,
    // this turns [{ fullName: "John" }] into just { fullName: "John" }
    {
        $unwind: "$subscriberDetails"
    },
    // Stage 4: Final Sculpting
    // We lift the user details up to the top level for a clean JSON response
    {
        $project: {
            _id: 0, // Hide the Subscription document's _id
            fullName: "$subscriberDetails.fullName",
            username: "$subscriberDetails.username",
            avatar: "$subscriberDetails.avatar",
            subscribedAt: "$createdAt" // We can keep the timestamp from the Subscription doc!
        }
    }
    ]);
    if (subscriber.length === 0) {
        throw new ApiError(404,'No Subscriber')
    }
    return res.status(200).json(
        new ApiResponse(200,subscriber,'Subscriber List Featched')
    )
    

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(400, "Subscriber ID is required")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404,'Channel Not Found.')
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}