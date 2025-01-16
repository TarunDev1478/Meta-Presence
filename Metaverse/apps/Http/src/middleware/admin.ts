import jwt, { decode } from "jsonwebtoken";
import { JWT_password } from "../config";
import { NextFunction, Request, Response } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"]; // Correct spelling of 'authorization'
    if (!header || typeof header !== "string") {
        res.status(403).json({ message: "Unauthorized: Missing or invalid token header" });
        return;
    }

    const token = header.split(" ")[1];
    if (!token) {
        res.status(403).json({ message: "Unauthorized: Token not found" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_password) as { role: string; userId: string };
        if(decoded.role !== 'Admin'){
            res.status(403).json({Message:"Unotharized"})
            return
        }
        req.userId = decoded.userId; // Assuming `req.userId` is a valid property or needs to be added to the type
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return
    }
};
