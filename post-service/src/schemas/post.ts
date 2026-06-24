import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(10000),
  authorUsername: z.string().min(3).max(30),
  categorySlug: z.string().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  categorySlug: z.string().optional(),
});