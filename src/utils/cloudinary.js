import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { buffer } from "stream/consumers";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //file has been uploaded successfully
        // console.log("File is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temparary file as the upload operation get failed
        return null;
    }
};
const uploadOnCloudinarybyBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: "avatars",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            )
            .end(buffer);
    });
};

const deleteFromCloudinaryByUrl = async (secureUrl) => {
    try {
        if (!secureUrl) return null;

        // 1. Updated regex to capture BOTH the resource_type and the public_id
        const regex = /\/(image|video|raw)\/upload\/(?:v\d+\/)?([^\.]+)/;
        const match = secureUrl.match(regex);

        if (!match || !match[1] || !match[2]) {
            console.error(
                "Could not parse Cloudinary resource type or Public ID from URL:",
                secureUrl
            );
            return null;
        }

        const resourceType = match[1]; // e.g., "image" or "video"
        const publicId = match[2]; // e.g., "epkzonztacciuw7lzf3r"

        // 2. Destroy the file using the extracted ID AND the resource_type
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return response;
    } catch (error) {
        console.error("Cloudinary asset destruction failed", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinaryByUrl,
    uploadOnCloudinarybyBuffer,
};
