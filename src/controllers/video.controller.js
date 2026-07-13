import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinaryByUrl, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400,'Title and description are required.')
    }
    if (!req.files || !req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400,'Video or Thumbnail file are missing.')
    }
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;
    const video = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    if(!video || !thumbnail){
        throw new ApiError(400,'Failed to upload files.')
    }
    const UploadedVideo = await Video.create({
        title,
        description,
        thumbnail:thumbnail.secure_url,
        videoFile:video.secure_url,
        duration:video.duration,
        isPublished:true,
        owner:req.user?._id
    })
    return res.status(201).json(
        new ApiResponse(201,UploadedVideo,'Video uploaded successfully.')
    )
    
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
     
    if(!videoId){
        throw new ApiError(400,'Video Id is required.')
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,'Video not Found.')

    }
    return res.status(200).json(
        new ApiResponse(200,video,'Video Featched Successfully.')
    )
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400,'Video Id is required.')
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400,'Video not found or Invalid Video Id.')
    }
    const {title,description} = req.body || {};
    const thumbnail = req.file;
    
    
    const updateData = {}
    if(title!==undefined) updateData.title = title
    if(description!==undefined) updateData.description = description
    if(thumbnail!==undefined) updateData.thumbnail = thumbnail.path
    if(Object.keys(updateData).length === 0){
        throw new ApiError(400,'No changes found.')
    }
    if('title' in updateData && updateData.title !== video.title){
        video.title = updateData.title
    }
    if('description' in updateData && updateData.description !== video.description){
        video.description = updateData.description
    }
    
    if('thumbnail' in updateData){
        if(await deleteFromCloudinaryByUrl(video.thumbnail)){
            console.log('Thumbnail Deleted From Cloudinary.');
        }
        const thumbnailUrl = await uploadOnCloudinary(updateData.thumbnail)
        if(!thumbnail){
            throw new ApiError(400,'Error while uploading.')
        }
        video.thumbnail = thumbnailUrl.secure_url
    }
    const updatedData = await video.save();
    return res.status(200).json(
        new ApiResponse(200,updatedData,'Video details Updated.')
    )
    
    
 
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,'Video Id is required.')
    }
    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(400,"Video not Found.")
    }
    return res.status(200).json(
        new ApiResponse(200,{},'Video Deleted.')
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}