
import { z } from "zod";

export const createFlagSchema = z.object({
  reason: z.string().min(1).max(500),
  targetType: z.enum(["post", "reply"]),
  targetId: z.number().int().positive(),
});


export const updateFlagSchema = z.object({
  status: z.enum(["pending", "reviewed", "dismissed", "actioned"]),
  moderatorNote: z.string().min(1).max(500),
});