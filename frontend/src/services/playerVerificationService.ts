// frontend/src/lib/adminApi.ts
import api from './api';

const ADMIN_ENDPOINT = '/admin';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('pplt20_token');
  if (!token) throw new Error('No auth token found');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const approvePlayer = (playerId: string) => {
  return api.patch(`${ADMIN_ENDPOINT}/verify-player/${playerId}`, {}, {
    headers: getAuthHeaders(),
  });
};

export const rejectPlayer = (playerId: string) => {
  return api.patch(`${ADMIN_ENDPOINT}/reject-player/${playerId}`, {}, {
    headers: getAuthHeaders(),
  });
};
