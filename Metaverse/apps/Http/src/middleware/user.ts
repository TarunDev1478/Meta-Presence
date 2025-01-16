
import jwt from "jsonwebtoken";
import { JWT_password } from "../config";
import { NextFunction, Request, Response } from "express";

export const userAuthentication = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];
    const token = header?.split(" ")[1];
    console.log(req.route.path)
        console.log(token)
    
    if (!token) {
        res.status(403).json({message: "Unauthorized"})
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_password) as { role: string, userId: string }
        // if(decoded.role !== 'User'){
        //     res.status(403).json({Message:"Unotharized"})
        //     return
        // }
        req.userId = decoded.userId
        next()
    } catch(e) {
        res.status(401).json({message: "Unauthorized"})
        return
    }
}