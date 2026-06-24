import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./data-source";
import postRouter from "./routes/post";
import replyRouter from "./routes/reply";
import mediaRouter from "./routes/media";
import categoryRouter from "./routes/category";
import flagRouter from "./routes/flag";
const app = express();
app.use(express.json());

// routes
app.use("/api", postRouter);
app.use("/api", replyRouter);
app.use("/api", mediaRouter);
app.use("/api", categoryRouter);
app.use("/api", flagRouter);

// create http server and attach socket.io
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" }
});

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  // user joins a room for a specific post
  socket.on("join:post", (postId: number) => {
    socket.join(`post:${postId}`);
    console.log(`user joined post:${postId}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    httpServer.listen(3002, () => {
      console.log("Server running on http://localhost:3002");
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });