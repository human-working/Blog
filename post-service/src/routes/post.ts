import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Post } from "../entities/Post";
import { PostView } from "../entities/PostView";
import { PostLike } from "../entities/PostLike";
import geoip from "geoip-lite";
import crypto from "crypto";
import redis from "../redis";
import { authenticate, AuthRequest, optionalAuth } from "../middleware/authenticate";
import { createPostSchema, updatePostSchema } from "../schemas/post";
import { createLikeSchema } from "../schemas/postlikes";
import { validate } from "../middleware/validate";


const postRouter = Router();
const postRepo = AppDataSource.getRepository(Post);
const viewRepo = AppDataSource.getRepository(PostView);
const likeRepo = AppDataSource.getRepository(PostLike)

// create posts 
// // uses authenticated middleware to prevent IDOR 
postRouter.post("/posts", authenticate, validate(createPostSchema), async (req: AuthRequest, res: Response) => {
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

postRouter.get("/posts/search", async (req: Request, res: Response) => {
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

postRouter.get("/posts/user/:userId", async (req: Request, res: Response) => {
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

postRouter.get("/posts", async (req: Request, res: Response) => {
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


postRouter.get("/posts/category/:slug", async (req: Request, res: Response) => {
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

postRouter.get("/posts", async (req: Request, res: Response) => {
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

// get singular post & save as view 

postRouter.get("/posts/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `post:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const post = await postRepo.findOne({ where: { id: Number(id) } });
    if (!post || post.isHidden) return res.status(404).json({ message: "Post not found" });

    await redis.set(cacheKey, JSON.stringify(post), "EX", 60);

    // creates view 
    const postId = Number(req.params.id);
    const userId = req.user?.userId ?? null;

    // get IP
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] 
      || req.socket.remoteAddress 
      || "";

    // hash IP for privacy
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // lookup geo from IP
    const geo = geoip.lookup(ip);

    // cooldown check — don't count if viewed in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await viewRepo.findOne({
      where: { 
        postId, 
        userId: userId ?? undefined
      },
      order: { viewedAt: "DESC" }
    });

    if (recentView && recentView.viewedAt > oneHourAgo) {
      return res.json({ message: "View already recorded" });
    }

    const view = viewRepo.create({
      postId,
      userId,
      ipHash,
      country: geo?.country ?? null,
      city: geo?.city ?? null,
      region: geo?.region ?? null,
      latitude: geo?.ll?.[0] ?? null,
      longitude: geo?.ll?.[1] ?? null,
    });

    await viewRepo.save(view);

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


// patch posts
// uses authenticated middleware to prevent IDOR 

postRouter.patch("/posts/:id", authenticate, validate(updatePostSchema), async (req: AuthRequest, res: Response) => {
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
postRouter.delete("/post/:id", authenticate, async (req: AuthRequest, res: Response) => {
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
});


// record a view
postRouter.post("/posts/:id/view", authenticate,  async (req: AuthRequest, res) => {
  const view = viewRepo.create({
    postId: Number(req.params.id),
    userId: req.user?.userId ?? null,
  });
  await viewRepo.save(view);
  res.json({ message: "View recorded" });
});


// toggle like
postRouter.post("/posts/:id/like", authenticate, validate(createLikeSchema), async (req: AuthRequest, res) => {

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] 
      || req.socket.remoteAddress 
      || "";

    // hash IP for privacy
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // lookup geo from IP
  const geo = geoip.lookup(ip);

  const existing = await likeRepo.findOne({
    where: { postId: Number(req.params.id), userId: req.user!.userId }
  });

  if (existing) {
    await likeRepo.remove(existing);
    return res.json({ liked: false });
  }

  
  const like = likeRepo.create({
    postId: Number(req.params.id),
    userId: req.user!.userId,
    country: geo?.country ?? null,
    city: geo?.city ?? null,
    region: geo?.region ?? null,
    latitude: geo?.ll?.[0] ?? null,
    longitude: geo?.ll?.[1] ?? null,
  });
  
  await likeRepo.save(like);
  res.json({ liked: true });
});

// get like count + did I like this?
postRouter.get("/posts/:id/likes", async (req: AuthRequest, res) => {


  const count = await likeRepo.count({ where: { postId: Number(req.params.id) } });
  const userLiked = req.user
    ? !!(await likeRepo.findOne({ where: { postId: Number(req.params.id), userId: req.user.userId } }))
    : false;

  res.json({ count, userLiked });
});


export default postRouter;