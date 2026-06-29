import api from "../api/axios";
import { Category } from "../types/Category";


// GET category 
export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get("/category");
  return res.data;
};


// POST create category
export const createCategory = async (data: {
  name: string;
  description: string;
  slug: string;
  
}): Promise<Category> => {
  const res = await api.post("/posts", data);
  return res.data;
};