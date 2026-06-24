import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate";

export const requireModerator = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "moderator" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Moderator access required" });
  }
  next();
};