import { z } from "zod";

export const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
  authorUsername: z.string().min(3).max(30),
  postId: z.number().int().positive(),
});

export const updateReplySchema = z.object({
  content: z.string().min(1).max(5000).optional(),
});