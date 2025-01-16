import z from "zod";

export const signupSchema = z.object({
    username: z.string(),
    password: z.string(),
    type:z.enum(["User","Admin"]),
})


export const signinSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const updatemetaverseSchema = z.object({
    avatarId: z.string()
})

export const createspaceSchema = z.object({
        name: z.string(),
        dimention: z.string().regex(/^[0-9]\d{0,3}x[0-9]\d{0,3}$/),
        mapId: z.string().optional()
})

export const addelementSchema =z.object({
    elementId:z.string(),
    spaceId:z.string(),
    x:z.number(),
    y:z.number()
})

export const createelementadminSchema = z.object({
    imageUrl:z.string(),
    width:z.number(),
    height:z.number(),
    static:z.boolean()
})

export const updateElement = z.object({
    imageUrl:z.string(),
})

export const createAvatar =z.object({
    imageUrl:z.string(),
    name:z.string()
})

export const createMapschema = z.object({
    thumbnail: z.string(),
    dimensions: z.string().regex(/^[1-9]\d{0,3}x[1-9]\d{0,3}$/),
    defaultElements: z.array(z.object({
        elementId: z.string(),
        x: z.number(),
        y: z.number(),
    })),
    name: z.string(),
});

export const deleteElemntSchema =z.object({
    id:z.string(),
})

declare global {
    namespace Express {
      export interface Request {
        role:"Admin"| "User"
        userId: String;
      }
    }
  }