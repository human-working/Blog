import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Post } from "../entities/Post";
import { ILike } from "typeorm";
import slugify from "slugify";


const router = Router();
const postRepo = AppDataSource.getRepository(Post);


// create posts 

router.post("/posts/user/:userId", async (req: Request, res: Response) => {
  try {
    
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
    const slug = slugify(title, { lower: true, strict: true });
    const posts = await postRepo.find({
      where: { categorySlug: req.params.slug },
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

router.patch("/posts", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

   
});