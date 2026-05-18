import axiosInstance from "../axiosConfig";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  roleName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

export async function fetchUsers(params: { query?: string; status?: string }) {
  const response = await axiosInstance.get("/api/admin/users", {
    params: { q: params.query || "", status: params.status || "all" },
  });
  return response.data as AdminUser[];
}

export async function fetchUserDetail(id: string) {
  const response = await axiosInstance.get(`/api/admin/users/${id}`);
  return response.data as AdminUser;
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const response = await axiosInstance.patch(`/api/admin/users/${id}/status`, { isActive });
  return response.data as { id: string; isActive: boolean };
}
