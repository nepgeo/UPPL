// frontend/src/lib/newsApi.ts
import api from './api'; // use the axios instance from api.ts

const NEWS_ENDPOINT = '/news'; // relative to API_BASE

export const fetchAllNews = async () => {
  const res = await api.get(NEWS_ENDPOINT);
  return res.data;
};

export const fetchNewsById = async (id: string) => {
  const res = await api.get(`${NEWS_ENDPOINT}/${id}`);
  return res.data;
};

export const createNews = async (data: any, token?: string) => {
  const res = await api.post(NEWS_ENDPOINT, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};

export const updateNews = async (id: string, data: any, token?: string) => {
  const res = await api.put(`${NEWS_ENDPOINT}/${id}`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};

export const deleteNews = async (id: string, token?: string) => {
  const res = await api.delete(`${NEWS_ENDPOINT}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};
