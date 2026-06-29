import api from "../api/axios";
import { Post } from "../types/Post"

// GET all posts
export const getPosts = async (): Promise<Post[]> => {
  const res = await api.get("/posts");
  return res.data;
};

// GET single post
export const getPost = async (id: number): Promise<Post> => {
  const res = await api.get(`/posts/${id}`);
  return res.data;
};

// GET posts by user
export const getPostsByUser = async (userId: number): Promise<Post[]> => {
  const res = await api.get(`/posts/user/${userId}`);
  return res.data;
};

// GET posts by category
export const getPostsByCategory = async (slug: string): Promise<Post[]> => {
  const res = await api.get(`/posts/category/${slug}`);
  return res.data;
};

// GET search posts
export const searchPosts = async (q: string): Promise<Post[]> => {
  const res = await api.get(`/posts/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

// POST create post
export const createPost = async (data: {
  title: string;
  content: string;
  authorUsername: string;
  categorySlug?: string;
}): Promise<Post> => {
  const res = await api.post("/posts", data);
  return res.data;
};

// PATCH update post
export const updatePost = async (id: number, data: {
  title?: string;
  content?: string;
  categorySlug?: string;
}): Promise<Post> => {
  const res = await api.patch(`/posts/${id}`, data);
  return res.data;
};

// DELETE post
export const deletePost = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/posts/${id}`);
  return res.data;
};