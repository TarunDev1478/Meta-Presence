interface Avatar {
    imageUrl: string;
    id:string;
}

interface map {
    id: string;
    avatar: Avatar | null; // Optional or nullable

}

import { Router } from "express";
import { updatemetaverseSchema } from "../../types";
import { PrismaClient } from "@prisma/client";
import { userAuthentication } from "../../middleware/user";


export const userRouter = Router();
const client = new PrismaClient();

userRouter.post("/metadata", userAuthentication, async (req, res) => {
    console.log(req.body)
    const parsedInput = updatemetaverseSchema.safeParse(req.body);
    if (!parsedInput.success) {
        res.status(400).json({ message: "Invalid input" });
        return;
    }
    // const user =await client.user.findUnique({
    //     where:{
    //         id:req.uses
    //     }
    // })
    console.log(parsedInput.data.avatarId+"aafgdas");
    try {
        await client.user.update({
            where: {
                id: req.userId as string, 
            },
            data: {
                avatarId: parsedInput.data.avatarId,
            },
        });
        res.status(200).json({ message: "Metadata updated successfully" });
    } catch (error) {
        res.status(400).json({ message: "Internal server error", error });
    }
});

userRouter.get("/metadata/bulk", async (req, res) => {
    const userIdString = (req.query.ids ?? "[]") as string;
    const userIds = userIdString.slice(1, userIdString.length - 1).split(",");

    try {
        const metadata = await client.user.findMany({
            where: {
                id: {
                    in: userIds,
                },
            },
            select: {
                avatar: true,
                id: true,
            },
        });

        res.json({
            avatars: metadata.map((m:any) => ({
                userId: m.id,
                avatarId: m.avatar?.id ?? null, 
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

