import api from "../api/axios";
import { Reply } from "../types/Reply";

// GET replies by postId
export const getRepliesByPost = async (postId: number): Promise<Reply[]> => {
  const res = await api.get(`/reply/post/${postId}`);
  return res.data;
};

// POST create reply
export const createReply = async (data: {
  content: string;
  authorUsername: string;
  postId: number;
}): Promise<Reply> => {
  const res = await api.post("/reply", data);
  return res.data;
};

// PATCH update reply
export const updateReply = async (id: number, data: {
  content: string;
}): Promise<Reply> => {
  const res = await api.patch(`/reply/${id}`, data);
  return res.data;
};

// DELETE reply
export const deleteReply = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/reply/${id}`);
  return res.data;
};
