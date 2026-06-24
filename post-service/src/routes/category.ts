import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import redis from "../redis";

const router = Router();
const categoryRepo = AppDataSource.getRepository(Category);

// get all categories
router.get("/categories", async (req: Request, res: Response) => {
  try {

    // checks cache
    const cached = await redis.get("categories:all");
    if (cached) return res.json(JSON.parse(cached))

    const categories = await categoryRepo.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// create category - admin only functionality - need to add admin authentication


router.post("/categories", async (req: Request, res: Response) => {
  try {
    const { name, description, slug } = req.body;

    const category = categoryRepo.create({ name, description, slug });
    await categoryRepo.save(category);
    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;