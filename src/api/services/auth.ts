import axiosInstance from "../axiosConfig";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  username?: string;
};

export async function login(payload: LoginPayload) {
  const response = await axiosInstance.post("/api/auth/login", payload);
  return response.data as { accessToken: string };
}

export async function register(payload: RegisterPayload) {
  const response = await axiosInstance.post("/api/auth/register", payload);
  return response.data as { message: string };
}

export async function verifyEmail(token: string) {
  const response = await axiosInstance.get("/api/auth/verify-email", {
    params: { token },
  });
  return response.data as { message: string };
}

export async function logout() {
  const response = await axiosInstance.post("/api/auth/logout");
  return response.data as { message: string };
}
