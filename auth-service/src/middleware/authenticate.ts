import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

// header for Author
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// JWT Authentication Middleware
// Extracts and verifies the Bearer token from the Authorization header
// Attaches the decoded user payload (userId, email) to req.user
// Stateless verification — no DB hit required, signature is verified mathematically
// Short lived access tokens (15min) minimise risk if a token is stolen


export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(
      token!,
      env.JWT_SECRET
    ) as unknown as { userId: number; email: string, role: string };

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};