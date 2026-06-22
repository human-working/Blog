import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Post } from "../entities/Post";
import axios from "axios";
import { env } from "../env";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router = Router();
const postRepo = AppDataSource.getRepository(Post);

// create posts 
// // uses authenticated middleware to prevent IDOR 

router.post("/posts", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, authorUsername, categorySlug } = req.body;
    const authorId = req.user!.userId; 

    const post = postRepo.create({
      title, content, authorId, authorUsername,
      categorySlug, views: 0, likes: 0,
      isPinned: false, isLocked: false, hasMedia: false
    });

    await postRepo.save(post);
    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});
// search post by title

router.get("/posts/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query required" });

    const posts = await AppDataSource
      .getRepository(Post)
      .createQueryBuilder("post")
      .where(
        "to_tsvector('english', post.title || ' ' || post.content) @@ plainto_tsquery('english', :query)",
        { query: q }
      )
      .orderBy("post.createdAt", "DESC")
      .take(20)
      .getMany();

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// gets post by user 

router.get("/posts/user/:userId", async (req: Request, res: Response) => {
  try {

    const posts = await postRepo.find({
      where: { authorId: Number(req.params.userId) },
      order: { createdAt: "DESC" }
    });

    if (!posts.length) return res.status(404).json({ message: "No posts found for this user" });

    res.json(posts);
  } catch (err) {

    res.status(500).json({ message: "Server error", error: err });
  }
});


// get all posts in descending order 

router.get("/posts", async (req: Request, res: Response) => {
  try {
    const posts = await postRepo.find({
      order: { createdAt: "DESC" }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


// get posts by category
// 

router.get("/posts/category/:slug", async (req: Request, res: Response) => {
  try {
    const posts = await postRepo.find({
      where: { categorySlug: req.params.slug as string },
      order: { createdAt: "DESC" }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all posts in descending order 

router.get("/posts", async (req: Request, res: Response) => {
  try {
    const posts = await postRepo.find({
      order: { createdAt: "DESC" }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// patch posts
// uses authenticated middleware to prevent IDOR 

router.patch("/posts/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const post = await postRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.authorId !== req.user!.userId) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    Object.assign(post, req.body);
    await postRepo.save(post);

    res.json({ message: "Post updated successfully", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
})

// delete reply — only owner can delete
router.delete("/post/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const post = await postRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.authorId !== req.user!.userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await postRepo.remove(post);

    res.json({ message: "Reply deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});;