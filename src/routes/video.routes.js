import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getVideoDetails,
    uploadVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/uploadVideo").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    uploadVideo
);
router.route("/:videoId").get(getVideoDetails);

export default router;
