import axiosInstance from "../axiosConfig";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
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
