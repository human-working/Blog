import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit"

const app = express();


// global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests" }
});

app.use(globalLimiter);


// route to auth-service
app.use("/api/auth", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}
));

// route to posts-service
app.use("/api/posts", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}));

app.use("/api/reply", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}));

app.use("/api/media", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}));

app.use("/api/categories", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}));

app.use("/api/flags", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: (path) => path, 
}));

app.listen(3000, () => {
  console.log("Gateway running on http://localhost:3000");
});