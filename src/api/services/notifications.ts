import axiosInstance from "../axiosConfig";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  listing_id: string | null;
  is_read: boolean;
  created_at: string;
};

export async function fetchNotifications(): Promise<Notification[]> {
  const response = await axiosInstance.get("/api/notifications");
  return response.data;
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  const response = await axiosInstance.get("/api/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(id: string) {
  await axiosInstance.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await axiosInstance.post("/api/notifications/read-all");
}
