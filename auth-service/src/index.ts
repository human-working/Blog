import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import authRouter from "./routes/auth";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per 15 minutes
  message: { message: "Too many requests, please try again later" }
});

app.use(authLimiter, authRouter);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");


    app.listen(3001, () => {
      console.log("Server running on http://localhost:3001");
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });