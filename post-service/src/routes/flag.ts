import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Flag } from "../entities/Flag";
import { Post } from "../entities/Post";
import { Reply } from "../entities/Reply";
import redis from "../redis";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { requireModerator } from "../middleware/moderator";
import { updateFlagSchema, createFlagSchema } from "../schemas/flag";
import { validate } from "../middleware/validate";

const flagRouter = Router();
const flagRepo = AppDataSource.getRepository(Flag);
const postRepo = AppDataSource.getRepository(Post);
const replyRepo = AppDataSource.getRepository(Reply);

// create flag
// uses authenticated middleware to prevent IDOR 

flagRouter.post("/flags", authenticate, validate(createFlagSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { reason, targetId, targetType } = req.body;
    const reportedBy = req.user!.userId;

    const flag = flagRepo.create({
      reason,
      targetId,
      targetType,
      reportedBy,
      status: "pending",
      moderatorNote: null,
      reviewedBy: null
    });

    await flagRepo.save(flag);

    res.status(201).json({ message: "Flag created successfully, pending review", flag });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// update flag status - mod only


flagRouter.patch("/flags/:id", authenticate, requireModerator, validate(updateFlagSchema), async (req: AuthRequest, res: Response) => {
  try {
    const flag = await flagRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!flag) return res.status(404).json({ message: "Flag not found" });

    // only the assigned moderator can update
    if (flag.reviewedBy !== null && flag.reviewedBy !== req.user!.userId) {

      return res.status(403).json({ message: "This flag is assigned to another moderator" });

    }

    const { status, moderatorNote } = req.body;

    flag.status = status;
    flag.moderatorNote = moderatorNote;
    flag.reviewedBy = req.user!.userId; 

    if (status === "actioned") {
        if (flag.targetType === "post") {
            const post = await postRepo.findOne({ where: { id: flag.targetId } });
            if (post) {
            post.isHidden = true;
            await postRepo.save(post);


            // cascades so all replies on post are also hidden

            await replyRepo.update(
                    { postId: flag.targetId },
                    { isHidden: true }
                );
            }
            
        } else if (flag.targetType === "reply") {
            const reply = await replyRepo.findOne({ where: { id: flag.targetId } });
            if (reply) {
            reply.isHidden = true;
            await replyRepo.save(reply);
            }
        }
        }

    await flagRepo.save(flag);

    // invalidate flags cache
    await redis.del("flags:pending");

    res.json({ message: "Flag updated successfully", flag });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all assigned flags -  mod only

flagRouter.get("/flags/mine", authenticate, requireModerator, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = "flags:mine";

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const flags = await flagRepo.find({
      where: { 
        reviewedBy: req.user!.userId,
       },

      order: { createdAt: "ASC" } 
    });

    await redis.set(cacheKey, JSON.stringify(flags), "EX", 30); 
    
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// show flagged post 

flagRouter.get("/flags/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `flags:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const flag = await flagRepo.findOne({ where: { id: Number(id) } });
    if (!flag) return res.status(404).json({ message: "Post not found" });

    await redis.set(cacheKey, JSON.stringify(flag), "EX", 60);

    res.json(flag);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


// get all unactioned flags

flagRouter.get("/flags/todo", authenticate, requireModerator, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = "flags:pending";

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const flags = await flagRepo.find({
      where: { 
        status: "pending", 
        reviewedBy: req.user!.userId
       },

      order: { createdAt: "ASC" } 
    });

    await redis.set(cacheKey, JSON.stringify(flags), "EX", 30); 
    
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all flags

flagRouter.get("/flags", authenticate, requireModerator, async (req: AuthRequest, res: Response) => { 

    try {

    const cached = await redis.get("posts")
    if (cached) return res.json(JSON.parse(cached));


    const flags = await flagRepo.find({
      order: { createdAt: "DESC" }
    });

    await redis.set("posts", JSON.stringify(flags), "EX", 60);

    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }

});


export default flagRouter;
