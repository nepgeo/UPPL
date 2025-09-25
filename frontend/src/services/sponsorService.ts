// frontend/src/lib/sponsorsApi.ts
import api from './api';

const SPONSORS_ENDPOINT = '/sponsors';

// Helper to get auth headers
const getAuthConfig = (isMultipart = false) => {
  const token = localStorage.getItem('pplt20_token');
  if (!token) throw new Error('No auth token found');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
    },
  };
};

// ====================
// ORGANIZATION SPONSORS
// ====================

export const fetchOrganizations = async () => {
  const res = await api.get(`${SPONSORS_ENDPOINT}/organizations`);
  return res.data;
};

export const createOrganization = async (formData: FormData) => {
  const res = await api.post(`${SPONSORS_ENDPOINT}/organizations`, formData, getAuthConfig(true));
  return res.data;
};

export const updateOrganization = async (id: string, formData: FormData) => {
  const res = await api.put(`${SPONSORS_ENDPOINT}/organizations/${id}`, formData, getAuthConfig(true));
  return res.data;
};

export const deleteOrganization = async (id: string) => {
  const res = await api.delete(`${SPONSORS_ENDPOINT}/organizations/${id}`, getAuthConfig());
  return res.data;
};

// ====================
// INDIVIDUAL SPONSORS
// ====================

export const fetchIndividuals = async () => {
  const res = await api.get(`${SPONSORS_ENDPOINT}/individuals`);
  return res.data;
};

export const createIndividual = async (formData: FormData) => {
  const res = await api.post(`${SPONSORS_ENDPOINT}/individuals`, formData, getAuthConfig(true));
  return res.data;
};

export const updateIndividual = async (id: string, formData: FormData) => {
  const res = await api.put(`${SPONSORS_ENDPOINT}/individuals/${id}`, formData, getAuthConfig(true));
  return res.data;
};

export const deleteIndividual = async (id: string) => {
  const res = await api.delete(`${SPONSORS_ENDPOINT}/individuals/${id}`, getAuthConfig());
  return res.data;
};
