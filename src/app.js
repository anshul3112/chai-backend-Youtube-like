import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'; // to access and use cookies of browser

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
}))

app.use(express.json({
    limit : "16kb"
}))
app.use(express.urlencoded({
    extended : true, // object inside object
    limit : '16kb'
}))
app.use(express.static("public")); // to store assets in public

app.use(cookieParser());


//routes import :

import userRouter from './routes/user.routes.js';

// routes decleration:
// app.get -> when not using routed
// now it is mandatory to use middleware

app.use('/api/v1/users' , userRouter);
// https://localhost:8000/api/v1/users/register


       
export {app};