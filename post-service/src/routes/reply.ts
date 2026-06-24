import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { Reply } from "../entities/Reply";
import { createReplySchema, updateReplySchema } from "../schemas/reply";
import { validate } from "../middleware/validate";

const replyRouter = Router();
const replyRepo = AppDataSource.getRepository(Reply);


// create posts 
// // uses authenticated middleware to prevent IDOR 

replyRouter.post("/reply", authenticate, validate(createReplySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { content, authorUsername, postId } = req.body;
    const authorId = req.user!.userId;

    const reply = replyRepo.create({
      content, authorId, authorUsername, postId,
      likes: 0, isAiGenerated: false, hasMedia: false, isHidden: false
    });

    await replyRepo.save(reply);
    res.status(201).json({ message: "Reply created successfully", reply });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get replies by postId
replyRouter.get("/reply/post/:postId", async (req: Request, res: Response) => {
  try {
    const replies = await replyRepo.find({
      where: { 
        postId: Number(req.params.postId), 
        isHidden: false},
      order: { createdAt: "ASC" }
    });

    if (!replies.length) return res.status(404).json({ message: "No replies found for this post" });

    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// delete reply — only owner can delete
replyRouter.delete("/reply/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reply = await replyRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!reply || reply.isHidden) return res.status(404).json({ message: "Reply not found" });

    if (reply.authorId !== req.user!.userId) {
      return res.status(403).json({ message: "You can only delete your own replies" });
    }

    await replyRepo.remove(reply);

    res.json({ message: "Reply deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// patch reply — only owner can edit
replyRouter.patch("/reply/:id", authenticate, validate(updateReplySchema), async (req: AuthRequest, res: Response) => {
  try {
    const reply = await replyRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!reply || reply.isHidden) return res.status(404).json({ message: "Reply not found" });

    if (reply.authorId !== req.user!.userId) {
      return res.status(403).json({ message: "You can only edit your own replies" });
    }

    Object.assign(reply, req.body);
    await replyRepo.save(reply);

    res.json({ message: "Reply updated successfully", reply });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default replyRouter;