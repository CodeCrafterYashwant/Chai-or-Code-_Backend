import { Router } from "express";
import {
    subscribeToChannel,
    unsubscribeChannel,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/subscribe/:channel_Id").post(verifyJWT, subscribeToChannel);
router.route("/unsubscribe/:channel_Id").delete(verifyJWT, unsubscribeChannel);

export default router;
