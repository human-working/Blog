import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRouter);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

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