import { LargeNumberLike } from "crypto";

export type Post = {
    id: number;
    title: string;
    content: string;
    authorid: string;
    authorUsername: string;
    views: number;
    likes: number;
    isPinned: boolean;
    isLocked: boolean;
    isFlagged: boolean;
    isHidden: boolean;
    hasMedia: boolean;
    categorySlug: string | null;
    createdAt: Date;
    updatedAt: Date;
}