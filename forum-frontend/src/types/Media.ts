
export type Media = {
 
  id: number;
  url: string;
  type: string; // "image" | "video"
  filename: string;
  mimetype: string;
  isHidden: boolean;
  size: number;
  uploadedBy: number; 
  postId: number | null;
  replyId: number | null; 
  uploadedAt: Date;
}