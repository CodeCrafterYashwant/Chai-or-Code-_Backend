import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:process.env.LIMIT}));
app.use(express.urlencoded({extended:true,limit:process.env.LIMIT}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(morgan('tiny'))

//routes import
import userRouter from './routes/user.routes.js'
import morgan from "morgan";


//routes declaration
app.use("/api/v1/users",userRouter)

//localhost:8000/api/v1/users/register
// export default app;
export {app};