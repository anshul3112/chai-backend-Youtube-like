//Second approach for DB connection -- RECOMMENDED :
import dotenv from 'dotenv'
import express from 'express'
import connectDB from './db/dbindex.js';
dotenv.config();

connectDB();

/*
-------------------------------FIRST APPROACH-----------------------------------------------------------
import express from 'express'
const app = express();
// IIFE  – Immediately Invoked Function Expression:
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror" , (error) => {
            console.log("Error occured" , error);
            throw error;
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is listening on PORT : ${process.env.PORT}`)
        })
    }catch(error)
    {
        console.log("Error while connection DB : " , error)
    }
})()
------------------------------------------------------------------------------------------------------
*/

