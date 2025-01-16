interface elements{
    id:string;
    imageUrl:string;
    width:number;
    height:number;
    static:boolean;
}

interface avatar {
    id: string | null;
    imageUrl: string  | null; // Allow null
    name: string   | null;   // Allow null
}

import express from "express"; 
import { Router } from "express";

import { signinSchema, signupSchema } from "../../types";
import {PrismaClient} from "@prisma/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_password } from "../../config";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";

export const router = Router();
const client =new PrismaClient();
router.post("/signup", async (req, res) => {
    
    const parsedinput = signupSchema.safeParse(req.body);
    
    console.log(parsedinput.data?.password);
    console.log(parsedinput.data?.username);

    if (!parsedinput.success) {
        res.status(400).json({ message: "Invalid Input" });
        return; 
    }

    try {
        const hashedPassword = await bcrypt.hash(parsedinput.data.password, 10);
        console.log(hashedPassword);
        const user1 =await client.user.findUnique({
            where:{
                username:parsedinput.data.username
            }
        })
        if(user1){
            res.status(400).json({Message:"User Already exist"})
            return
        }
        console.log(1)
        const user = await client.user.create({
            data: {
                username: parsedinput.data.username,
                password: hashedPassword,
                role: parsedinput.data.type === "Admin" ? "Admin" : "User",
            },
        });
        console.log("signup succesfull");
        res.status(200).json({
            message: "Signed up successfully",
            userId: user.id,
        });

    } catch (e) {
        res.status(500).json({ message: "Internal server Error" });
    }
});

router.post("/signin",async (req:any ,res:any )=>{
    
    const parsedinput = signinSchema.safeParse(req.body);
    console.log(parsedinput.data?.username);
    console.log(parsedinput.data?.password);
    
    if(!parsedinput.success){
        res.status(400).json({message:"Invalid input"});
        return
    }
    try {
        const user = await client.user.findUnique({
            where:{
                username:parsedinput.data.username
            }
        })
        if(!user){
            res.status(403).json({message:"User not found"});
            return
        }
        const isValid = await bcrypt.compare(parsedinput.data.password,user.password);
        if(!isValid){
            res.status(403).json({Message:"Invalid Password"})
        }
        const token = jwt.sign({
            userId: user.id,
            role:user.role
        },JWT_password);
        console.log("login succesfull");
        return res.status(200).json({ token });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/elements", async (req, res) => {
    try {
        const avatars = await client.element.findMany();
        res.status(200).json({
            avatars: avatars.map((s:elements) => ({
                id: s.id,
                imageUrl: s.imageUrl, // Fixed camelCase typo
                width: s.width,
                height: s.height,
                static: s.static,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch elements", error });
    }
});

router.get("/avatars", async (req, res) => {
    try {
        const avatars = await client.avatar.findMany();
        res.status(200).json({
            avatars: avatars.map((s:avatar) => ({
                id: s.id,
                imageUrl: s.imageUrl, // Fixed camelCase typo
                name: s.name,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch avatars", error });
    }
});


router.get("/avatars", async (req, res) => {
    try {
        const avatars = await client.avatar.findMany(); 
        res.status(200).json({avatar:avatars.map((s:avatar)=>({
            id:s.id,
            imageurl:s.imageUrl,
            name:s.name
        }))});
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch avatars", error });
    }
});


router.use("/user",userRouter);
router.use("/admin",adminRouter);
router.use("/space",spaceRouter);
