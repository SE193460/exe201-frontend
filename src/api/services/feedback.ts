import axios from "axios";
import axiosInstance from "../axiosConfig";

const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
});

export type FeedbackItem = {
  id: string;
  userId: string | null;
  content: string;
  createdAt: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  roleName?: string | null;
  isAnonymous: boolean;
  displayName: string;
};

export async function submitFeedback(content: string) {
  const token = localStorage.getItem("access_token");
  const response = await publicAxios.post(
    "/api/feedback",
    { content },
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined
  );
  return response.data as { id: string; userId: string | null; content: string; createdAt: string };
}

export async function fetchAdminFeedbacks() {
  const response = await axiosInstance.get("/api/admin/feedbacks");
  return response.data as FeedbackItem[];
}