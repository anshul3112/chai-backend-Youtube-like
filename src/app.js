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

export {app};