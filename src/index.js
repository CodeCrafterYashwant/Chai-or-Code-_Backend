import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";

connectDB();

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
