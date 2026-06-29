export type Reply = {

  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  postId: number;
  likes: number;
  isAiGenerated: boolean;
  isHidden: boolean;
  hasMedia: boolean;
  createdAt: Date;
  updatedAt: Date;
  
}