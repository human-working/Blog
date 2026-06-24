import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Post } from "../entities/Post";
import redis from "../redis";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { id } from "zod/locales";

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
      isPinned: false, isLocked: false, hasMedia: false, isFlagged: false,
      isHidden: false
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

    // checks cache - searching is an expensive query so this is important for efficency 

    const cacheKey = `search:${q}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached))

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

     // saves results to cache 

    await redis.set(cacheKey, JSON.stringify(posts), "EX", 60);
    
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// gets post by user 

router.get("/posts/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cacheKey = `posts:user:${userId}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const posts = await postRepo.find({
      where: { authorId: Number(userId) },
      order: { createdAt: "DESC" }
    });

    if (!posts.length) return res.status(404).json({ message: "No posts found for this user" });

    await redis.set(cacheKey, JSON.stringify(posts), "EX", 60);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all posts in descending order 

router.get("/posts", async (req: Request, res: Response) => {
  try {

    const cached = await redis.get("posts")
    if (cached) return res.json(JSON.parse(cached));


    const posts = await postRepo.find({
      order: { createdAt: "DESC" }
    });

    await redis.set("posts", JSON.stringify(posts), "EX", 60);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


// get posts by category


router.get("/posts/category/:slug", async (req: Request, res: Response) => {
  try {

    // checks cache

    const { slug } = req.params;
    const cacheKey = `posts:category:${slug}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const posts = await postRepo.find({
      where: { 
        categorySlug: req.params.slug as string, 
        isHidden: false } ,
      order: { createdAt: "DESC" }
    });

    res.json(posts);

    // saves results to cache 

    await redis.set(cacheKey, JSON.stringify(posts), "EX", 60);

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get all posts in descending order 

router.get("/posts", async (req: Request, res: Response) => {
  try {

    // checks cache for posts - frequently used query so caching is important 

    const cached = await redis.get("posts:all");
    if (cached) return res.json(JSON.parse(cached));

    const posts = await postRepo.find({
        where: { isHidden: false },
        order: { createdAt: "DESC" }
    });

    await redis.set("posts:all", JSON.stringify(posts), "EX", 60);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get singular post 

router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `post:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const post = await postRepo.findOne({ where: { id: Number(id) } });
    if (!post || post.isHidden) return res.status(404).json({ message: "Post not found" });

    await redis.set(cacheKey, JSON.stringify(post), "EX", 60);

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


// patch posts
// uses authenticated middleware to prevent IDOR 

router.patch("/posts/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {



    const post = await postRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!post || post.isHidden) return res.status(404).json({ message: "Post not found" });
 

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
    if (!post || post.isHidden) return res.status(404).json({ message: "Post not found" });

    if (post.authorId !== req.user!.userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await postRepo.remove(post);

    res.json({ message: "Reply deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});;