// frontend/src/lib/api.ts
import axios from 'axios';
import { API_BASE as CONFIG_API_BASE, BASE_URL as CONFIG_BASE_URL } from '@/config';

const API_BASE = (import.meta.env.VITE_API_URL as string) || CONFIG_API_BASE;
const BASE_URL = (import.meta.env.VITE_BASE_URL as string) || CONFIG_BASE_URL;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false // set true only if you use cookies and backend configured
});

// Optional: attach auth token to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pplt20_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export { api, API_BASE, BASE_URL };
export default api;
