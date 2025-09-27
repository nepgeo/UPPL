// frontend/src/lib/api.ts
import axios from "axios";
import { API_BASE } from "@/config";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // ❌ disable unless using cookies
});

// Attach auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pplt20_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized, redirecting to login...");
      // Optional: clear token + redirect
      localStorage.removeItem("pplt20_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
