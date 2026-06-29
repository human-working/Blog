import api from "../api/axios";
import { Media } from "../types/Media";

// GET all Media
export const getMedia = async (): Promise<Media[]> => {
  const res = await api.get("/media");
  return res.data;
};

// GET Media by PostID
export const getMediaByPostId = async (postId: number): Promise<Media[]> => {
  const res = await api.get(`/media/post/${postId}`);
  return res.data;
};


// GET Media by ReplyID
export const getMediaByReplyId = async (replyId: number): Promise<Media[]> => {
  const res = await api.get(`/media/reply/${replyId}`);
  return res.data;
};

// POST create Media
export const uploadMedia = async (
  file: File,
  postId?: number,
  replyId?: number
): Promise<Media> => {

  const formData = new FormData();

  formData.append("file", file);
  if (postId) {
    formData.append("postId", postId.toString());
  }
  if (replyId) {
    formData.append("replyId", replyId.toString());
  }

  const res = await api.post("/media/upload", formData);

  return res.data;
};


// DELETE media
export const deleteMedia = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete(`/media/${id}`);
  return res.data;
};