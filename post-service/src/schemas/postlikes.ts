
import { z } from "zod";

export const createLikeSchema= z.object({

    postId: z.number().int().positive(),
    userId: z.number().int().positive(),

});