import mongoose, { isValidObjectId, Types } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });
    if (!createdPlaylist) {
        throw new ApiError(500, "Failed to create playlist");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdPlaylist,
                "Playlist created successfully"
            )
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId || userId.trim() === "") {
        throw new ApiError(400, "User ID is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }
    const playlist = await Playlist.find({
        owner: new Types.ObjectId(userId),
    });
    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found or has not been created yet"
        );
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist Featched Succesfully."));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Plalist ID is required");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist Featched Successfully.")
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Enter playlist and video ID");
    }
    if (!(await Video.findById(videoId))) {
        throw new ApiError(404, "Video not Found.");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not Found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not owner of this Playlist.");
    }
    if (!playlist.video.includes(videoId)) {
        playlist.video.push(videoId);
    }
    await playlist.save();
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video Added to Playlist."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Enter playlist and video ID");
    }
    if (!(await Video.findById(videoId))) {
        throw new ApiError(404, "Video not Found.");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not Found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not owner of this Playlist.");
    }
    playlist.video.pull(videoId);
    await playlist.save();
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed From Playlist."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Plalist ID is required");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not owner of this playlist.");
    }
    await playlist.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist Deleted Succesfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Plalist ID is required");
    }
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(
            400,
            "Name and Description are required to update Playlist"
        );
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not owner of this playlist.");
    }
    playlist.name = name;
    playlist.description = description;
    const newPlaylist = await playlist.save();
    if (!newPlaylist) {
        throw new ApiError(400, "Error while saving data on db.");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, newPlaylist, "Playlist Updated Successfully.")
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
