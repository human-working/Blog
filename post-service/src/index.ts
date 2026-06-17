import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { AppDataSource } from "./data-source";

const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(3002, () => {
      console.log("Server running on http://localhost:3002");
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });