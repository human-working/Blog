import { z } from "zod";

export const uploadMediaSchema = z.object({
  postId: z.string().optional(),
  replyId: z.string().optional(),
});