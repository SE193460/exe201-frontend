import axiosInstance from "../axiosConfig";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  username: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  roleName?: string;
};

export async function fetchProfile() {
  const response = await axiosInstance.get("/api/users/me");
  return response.data as UserProfile;
}

export async function updateProfile(payload: {
  fullName: string;
  username?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
}) {
  const response = await axiosInstance.put("/api/users/me", payload);
  return response.data as UserProfile;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await axiosInstance.post("/api/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as { avatarUrl: string };
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const response = await axiosInstance.put("/api/users/me/password", payload);
  return response.data as { message: string };
}

export function resolveAvatarUrl(avatarUrl: string) {
  if (!avatarUrl) return avatarUrl;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  return `${baseUrl}${avatarUrl}`;
}
