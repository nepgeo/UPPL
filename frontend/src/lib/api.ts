import axios from "axios";
import { API_BASE } from "@/config";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pplt20_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pplt20_user");
      localStorage.removeItem("pplt20_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
