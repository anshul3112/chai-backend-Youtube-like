import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false}) // dont need to pass all feilds like password,username,etc

        return {accessToken,refreshToken};

    }catch(err)
    {
        throw new ApiError(500,"Something went wrong while generateAccessAndRefreshToken")
    }
}

const registerUser = asyncHandler(async(req,res) => {  
/*
    get user details from fronetend
    validation (no empty passoword / name / email)
    check if user already exists
    check for images ,check for avatar
    upload them to cloudinary , avatar
    create user object , create entry in db
    remove password and refresh token feild from response
    check for user creation
    resturn response
*/
    
    const {fullname, email, username , password} =  req.body

    if(
        [fullname, email, username , password].some((feild) => {
            return (feild?.trim === "")
        })
    )
    {
        throw new ApiError(400,"ALL FEILDS ARE REQUIRED");
    }

    const existingUser = await User.findOne({
        $or : [{ username },{ email }]
    });

    if(existingUser){
        throw new ApiError(409,"User with same email or username already exists")
    }

    // const avatarLocalPath = req.files?.avatar[0].path;
    let avatarLocalPath;
    // = req.files?.coverImage[0].path;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0)
    {
        avatarLocalPath = req.files.avatar[0].path
    }    

    let coverImageLocalPath;
    // = req.files?.coverImage[0].path;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath) 
        throw new ApiError(400,"Avatar file is required here");


    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage =  await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
        throw new ApiError(400,"Avatar file is required");

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res) => {
    /*
        req body -> data
        username or email check for match
        password check
        access and refresh token generate
        send these token in cookies
    */

    const {email,username,password} = req.body;

    if(!(username || email))
    {
        throw new ApiError(400,"Username and email both are required");
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user)
    {
        throw new ApiError(404,"User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid)
    {
        throw new ApiError(401,"Password incorrect");
    }

    // create access and refresh token : , creating method for this (generateAccessAndRefreshToken)

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,     // cookies modifiable by server only 
        secure : true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(200,{user : loggedInUser,accessToken,refreshToken,},"User logged in Successfully")
    );

})

const logoutuser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
    {
        //updation:
        $set : {
            refreshToken : undefined
        }
    },
    {
            new : true
    })

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{},"User logged out")
    )

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user)
        {
            throw new ApiError(401,"Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken , refreshToken : "newRefreshToken"},"Access Token Refreshed")
        )

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutuser,
    refreshAccessToken
};