// schemas/flag.ts
import { z } from "zod";

export const updateFlagSchema = z.object({
  status: z.enum(["pending", "reviewed", "dismissed", "actioned"]),
  moderatorNote: z.string().min(1).max(500),
});