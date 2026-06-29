import api from "../api/axios";
import { Flag } from "../types/Flag";


// GET all Flags
export const getFlags = async (): Promise<Flag[]> => {
  const res = await api.get("/flags");
  return res.data;
};

// POST create reply
export const createFlag = async (data: {
    reason: string
    targetid: number
    targetType: "post" | "reply"
    reportedBy: number
}): Promise<Flag> => {
  const res = await api.post("/flags", data);
  return res.data;
};

// GET flags assigned to logged in mod
export const getMyFlags = async (): Promise<Flag[]> => {
  const res = await api.get("/flags/mine");
  return res.data;
};

// GET mod todo flags
export const getTodoFlags = async (): Promise<Flag[]> => {
  const res = await api.get("/flags/todo");
  return res.data;
};

export const updateFlag = async (id: number, data: {
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  moderatorNote: string;
}): Promise<Flag> => {
  const res = await api.patch(`/flags/${id}`, data);
  return res.data;
};
