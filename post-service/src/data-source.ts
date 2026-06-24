import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Media } from "./entities/Media";
import { Post } from "./entities/Post";
import { Reply } from "./entities/Reply";
import { Category } from "./entities/Category";
import { Flag } from "./entities/Flag";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "posts_db",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: [Media, Post, Reply, Category, Flag],
});10