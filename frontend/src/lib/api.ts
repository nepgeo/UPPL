// frontend/src/lib/api.ts
import axios from "axios";
import { API_BASE } from "@/config";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // set true only if you use cookies and backend configured
});

// Optional: attach auth token to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pplt20_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };  
export default api;
