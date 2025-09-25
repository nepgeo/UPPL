// api.ts
import axios from 'axios';
import { API_BASE, BASE_URL } from '@/config';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ✅ same key as login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
