import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
    .then(() => {
        app.on("Error", (err) => {
            console.log("Error: ", err);
            throw err;
        });
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at PORT: ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGODB Connection Failed !!!", err);
    });

/*import express from "express";
const app = express(); 
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("Error",(error)=>{   
            console.error("ERROR: ",error);
            throw error;
        });
        app.listen(process.env.PORT,()=>{
            console.log(`App is listing on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error('ERROR: ',error);
        throw error;
        
    }
})();
*/
