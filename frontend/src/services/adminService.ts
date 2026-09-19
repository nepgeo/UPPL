import api  from '@/lib/api';


export const getAdminDashboard = async (seasonId?: string) => {
  const token = localStorage.getItem('pplt20_token');

  try {
    const params: any = {};
    if (seasonId) params.seasonNumber = seasonId;
    const { data } = await api.get('/admin/admin-dashboard', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admin dashboard');
  }
};


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

export default {
  getAdminDashboard,
  getPendingPlayers,
};
