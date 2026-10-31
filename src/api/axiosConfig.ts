import axios from "axios";
import { ACCESS_TOKEN_KEY, clearSoftFilterCache } from "./services/session";

// Determine API base URL: prioritize env var, fallback to current origin
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Use current origin (scheme + domain + port) for deployed environments
  return typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      clearSoftFilterCache();
      // Only bounce to the login page when an authenticated session actually
      // expired. Anonymous visitors hitting an auth-only endpoint must stay on
      // the public page they are browsing instead of being forced to log in.
      if (hadToken && window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
