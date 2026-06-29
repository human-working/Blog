
export type Flag = {

  id: number;
  reportedBy: number;
  reason: string;
  targetType: string; 
  targetId: number; 
  status: string; // "pending" | "reviewed" | "dismissed" | "actioned"
  moderatorNote: string | null;
  reviewedBy: number | null; 
  createdAt: Date;
  
}