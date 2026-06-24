import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Flag } from "../entities/Flag";
import redis from "../redis";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { requireModerator } from "../middleware/moderator";
import { updateFlagSchema } from "../schemas/flag";
import { validate } from "../middleware/validate";

const router = Router();
const flagRepo = AppDataSource.getRepository(Flag);

// create flag
// uses authenticated middleware to prevent IDOR 

router.post("/flags", authenticate, async (req: AuthRequest, res: Response) => {
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


router.patch("/flags/:id", authenticate, requireModerator, validate(updateFlagSchema), async (req: AuthRequest, res: Response) => {
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

    await flagRepo.save(flag);

    // invalidate flags cache
    await redis.del("flags:pending");

    res.json({ message: "Flag updated successfully", flag });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all assigned flags -  mod only

router.get("/flags/mine", authenticate, requireModerator, async (req: AuthRequest, res: Response) => {
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

router.get("/flags/:id", async (req: Request, res: Response) => {
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

router.get("/flags/todo", authenticate, requireModerator, async (req: AuthRequest, res: Response) => {
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

router.get("/flags", authenticate, requireModerator, async (req: AuthRequest, res: Response) => { 

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

// delete flag 

