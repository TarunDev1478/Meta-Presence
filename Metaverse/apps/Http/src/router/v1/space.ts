
interface MapElement {
    elementId: string;
    x: number;
    y: number;
}
interface member {
    id: string;
    avatarId: string;
    joinedAt: Date;
    username: string;
    user: any
}
interface spaceElemets {
    id: string | null;
    element: {
        id: string;
        imageUrl: string;
        static: boolean;
        height: number;
        width: number;
    };
    x: number;
    y: number | null;

}
interface space {
    id: string;
    name: string;
    width: number;
    height: number;
    thumbnail: string | null;
    dimension?: string;
}
import { Router } from "express";
import { addelementSchema, createspaceSchema, deleteElemntSchema } from "../../types";
import { PrismaClient } from "@prisma/client"

import { userAuthentication } from "../../middleware/user";
export const spaceRouter = Router();

const client = new PrismaClient();
spaceRouter.post("/", userAuthentication, async (req, res) => {
    const parsedInput = createspaceSchema.safeParse(req.body);
    if (!parsedInput.success) {
        res.status(400).json({ message: "Invalid input" });
        return;
    }
    const dimensionInfo = parsedInput.data.dimention.split("x");
    if (!parsedInput.data.mapId) {
        const space = await client.space.create({
            data: {
                name: parsedInput.data.name,
                height: parseInt(dimensionInfo[1]),
                width: parseInt(dimensionInfo[0]),
                creatorId: req.userId as string
            }
        });
        res.status(200).json({ spaceId: space.id })
        return
    }

    const map = await client.map.findUnique({
        where: {
            id: parsedInput.data.mapId
        }, select: {
            mapElements: true,
            width: true,
            height: true,
        }
    })
    if (!map) {
        res.status(403).json({ message: "Map does not exist" });
        return
    }

    let space = await client.$transaction(async () => {
        const space = await client.space.create({
            data: {
                name: parsedInput.data.name,
                width: map.width,
                height: map.height,
                creatorId: req.userId as string,
            },
        })
        await client.spaceElements.createMany({
            data: map.mapElements.map((e: any) => ({
                spaceId: space.id,
                elementId: e.elementId,
                x: e.x ?? 0, // Default to 0 if null
                y: e.y ?? 0, // Default to 0 if null
            }))
        })
        return space;
    })

    res.status(200).json({ spaceId: space.id });
});


spaceRouter.get("/all", userAuthentication, async (req, res) => {
    try {
        const user = await client.user.findUnique({
            where: {
                id: req.userId as string
            }, select: {
                spaces: true
            }
        });
        if (!user) {
            res.status(400).json({ Message: "Unotharised" });
            return
        }
        res.status(200).json({
            spaces: user.spaces.map((s: any) => ({
                id: s.id,
                name: s.name,
                dimension: `${s.width}x${s.height}`, // Construct dimension from width and height
                thumbnail: s.thumbnail,
            }))
        });
    } catch (error) {
        res.status(501).json({ message: "Server error occured" });
    }
})

spaceRouter.delete("/:spaceid", userAuthentication, async (req, res) => {
    const spaceid = req.params.spaceid; // Access route parameter
    if (!spaceid) {
        res.status(400).json({ message: "Space ID is required" });
        return;
    }

    const space = await client.space.findUnique({
        where: {
            id: spaceid,
        }, select: {
            creatorId: true
        }
    })
    if (!space) {
        res.status(400).json({ message: "The space you want to delete does not exist" });
        return
    }
    if (space.creatorId != req.userId) {
        res.status(403).json({ Message: "Unotharised" });
        return;
    }
    try {
        const del = await client.space.delete({
            where: {
                id: spaceid,
            }
        });
        res.status(200).json({ Message: "The space is deleted" });
    } catch (error) {
        res.status(501).json({ Message: "An erro=r occur at server sider" });
    }

});


spaceRouter.get("/:spaceid", async (req: any, res: any) => {
    const spaceid = req.params.spaceid;
    if (!spaceid) {
        return res.status(400).json({ message: "spaceid is required" });
    }

    try {
        const space = await client.space.findUnique({
            where: {
                id: spaceid,
            },
            include: {
                elements: {
                    include: {
                        element: true
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarId: true
                            }
                        }
                    }
                }
            }
        });

        if (!space) {
            return res.status(404).json({ message: "Space does not exist" });
        }

        return res.status(200).json({
            space: {
                dimension: `${space.width}x${space.height}`,
                elements: space.elements.map((s: any & {
                    element: Element
                }) => ({
                    id: s.id,
                    element: {
                        id: s.element.id,
                        imageUrl: s.element.imageUrl,
                        static: s.element.static,
                        height: s.element.height,
                        width: s.element.width,
                    },
                    x: s.x,
                    y: s.y ?? 0,
                })),
                members: space.members.map((m: any) => ({
                    id: m.user.id,
                    username: m.user.username,
                    avatarId: m.user.avatarId ?? null, 
                    joinedAt: m.joinedAt,
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
spaceRouter.post("/element", userAuthentication, async (req, res) => {
    const parsedInput = addelementSchema.safeParse(req.body);
    if (!parsedInput.success) {
        res.status(400).json({ message: "Invalid input" });
        return
    }
    const space = await client.space.findUnique({
        where: {
            id: parsedInput.data.spaceId,
            creatorId: req.userId as string
        }, select: {
            height: true,
            width: true
        }
    })
    if (!space) {
        res.status(404).json({ message: "Space not found" })
        return
    }
    if (parsedInput.data.x > space.width || parsedInput.data.y > space.height) {
        res.status(400).json({ Message: "Elements should be in Space" })
        return
    }
    await client.spaceElements.create({
        data: {
            elementId: parsedInput.data.elementId,
            spaceId: parsedInput.data.spaceId,
            x: parsedInput.data.x,
            y: parsedInput.data.y
        }
    })
    res.json({ message: "space elemnt added" });
})

spaceRouter.delete("/ele/element", userAuthentication, async (req, res) => {
    const parsedInput = deleteElemntSchema.safeParse(req.body);
    if (!parsedInput.success) {

        res.status(400).json({ message: "invalid input" });
        return
    }
    const spaceele = await client.spaceElements.findFirst({
        where: {
            id: parsedInput.data.id
        }, include: {
            space: true,
        }
    })
    if (!spaceele!.space.creatorId || spaceele!.space.creatorId != req.userId) {
        res.status(400).json({ message: "Not allowed to performthis operation" });
        return
    }
    const del = await client.spaceElements.delete({
        where: {
            id: parsedInput.data.id,
        }
    })
    res.status(200).json({ message: "Deleted succesfully the element" });
})

spaceRouter.post("/:spaceid/join", userAuthentication, async (req: any, res: any) => {
    const spaceid = req.params.spaceid;

    try {
        const space = await client.space.findUnique({
            where: { id: spaceid }
        });

        if (!space) {
            return res.status(404).json({ message: "Space not found" });
        }

        await client.spaceMember.create({
            data: {
                userId: req.userId as string,
                spaceId: spaceid
            }
        });

        return res.status(200).json({ message: "Joined space successfully" });
    } catch (error) {
        // if (error.code === 'P2002') {
        //     return res.status(400).json({ message: "Already joined this space" });
        // }
        return res.status(500).json({ message: "Server error occurred" });
    }
});

spaceRouter.delete("/:spaceid/leave", userAuthentication, async (req: any, res: any) => {
    const spaceid = req.params.spaceid;

    try {
        const membership = await client.spaceMember.findFirst({
            where: {
                userId: req.userId as string,
                spaceId: spaceid
            }
        });

        if (!membership) {
            return res.status(404).json({ message: "Not a member of this space" });
        }

        await client.spaceMember.delete({
            where: {
                id: membership.id
            }
        });

        return res.status(200).json({ message: "Left space successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error occurred" });
    }
});