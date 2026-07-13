import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: process.env.LIMIT }));
app.use(express.urlencoded({ extended: true, limit: process.env.LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("tiny"));

//routes import
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1", subscriptionRouter);
app.use("/api/v1/video", videoRouter);

//localhost:8000/api/v1/users/register
// export default app;
export { app };
