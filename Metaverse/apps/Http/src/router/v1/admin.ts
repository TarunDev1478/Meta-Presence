import { Router } from "express";
import { addelementSchema, createAvatar, createMapschema, createelementadminSchema, updateElement } from "../../types";
export const adminRouter = Router();
import {PrismaClient} from "@prisma/client"
import { parseIsolatedEntityName } from "typescript";
import { adminMiddleware } from "../../middleware/admin";
const client = new PrismaClient();


adminRouter.post("/element",adminMiddleware,async (req,res)=>{
    const parsedInput = createelementadminSchema.safeParse(req.body);
    if(!parsedInput.success){
        res.status(400).json({message:"Invalid input"});
        return
    }
    const element =await client.element.create({
        data:{
            imageUrl:parsedInput.data.imageUrl,
            width:parsedInput.data.width,
            height:parsedInput.data.height,
            static:parsedInput.data.static
        }
    })
    res.status(200).json({id:element.id});
})

adminRouter.put("/element/:elementid",adminMiddleware,async (req,res)=>{
    const param = req.params;
    const id= param.elementid;
    const parsedInput = updateElement.safeParse(req.body);
    if(!parsedInput.success){
        res.status(400).json({message:"Invalid input"});
        return;
    }
    try {
        const updatedElement = await client.element.update({
            where: {
                id: id, 
            },
            data:{
                imageUrl:parsedInput.data.imageUrl
            }, 
        });

        res.status(200).json({ message: "Element updated successfully", element: updatedElement });
    } catch (error) {
        res.status(500).json({ message: "Failed to update element", error });
    }
})

adminRouter.post("/avatar",adminMiddleware,async(req,res)=>{
    const parsedInput = createAvatar.safeParse(req.body);
    if(!parsedInput.success){
        res.status(400).json({message:"Invalid input"});
        return;
    }
    const avatar =await client.avatar.create({
        data:{
            imageUrl:parsedInput.data.imageUrl,
            name:parsedInput.data.name
        }
    })
    res.status(200).json({id:avatar.id})
})
adminRouter.post("/map",adminMiddleware,async(req,res)=>{
    const parsedInput = createMapschema.safeParse(req.body);
    if(!parsedInput.success){
        res.status(400).json({message:"Invalid input"});
        return;
    }
    const map =await  client.map.create({
        data:{
            thumbnail:parsedInput.data.thumbnail,
            height:parseInt(parsedInput.data.dimensions.split("x")[1]),
            width:parseInt(parsedInput.data.dimensions.split("x")[0]),
            name:parsedInput.data.name,
            mapElements: {
                create:parsedInput.data.defaultElements.map(e =>({
                    elementId:e.elementId,
                    x:e.x,
                    y:e.y
                }))
            }
        }
    })
    res.json({id:map.id});
})