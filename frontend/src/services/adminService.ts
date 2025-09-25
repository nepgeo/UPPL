import { api } from '@/lib/api';

// ✅ Get Admin Dashboard
export const getAdminDashboard = async () => {
  const token = localStorage.getItem('pplt20_token'); // token from localStorage

  try {
    const { data } = await api.get('/admin/admin-dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data; // Axios already parses JSON
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admin dashboard');
  }
};

// ✅ Get Pending Players
export const getPendingPlayers = async () => {
  const token = localStorage.getItem('pplt20_token');

  try {
    const { data } = await api.get('/admin/pending-players', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pending players');
  }
};
