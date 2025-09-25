// src/services/teamService.ts
import api from '@/lib/api';

const TEAMS_ENDPOINT = '/teams';

// Helper to get auth headers
const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('pplt20_token');
  if (!token) throw new Error('No auth token found');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
  };
};

// ✅ Create a new team
export const createTeam = async (formData: FormData) => {
  const res = await api.post(`${TEAMS_ENDPOINT}`, formData, {
    headers: getAuthHeaders(true),
  });
  return res.data;
};

// ✅ Get all teams
export const getTeams = async () => {
  const res = await api.get(`${TEAMS_ENDPOINT}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Get team by ID
export const getTeamById = async (id: string) => {
  const res = await api.get(`${TEAMS_ENDPOINT}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Update a team (with logo, receipt, and players)
export const updateTeam = async (
  teamId: string,
  data: {
    teamName?: string;
    captainName?: string;
    coachName?: string;
    managerName?: string;
    contactNumber?: string;
    players?: any[];
    teamLogoFile?: File | null;
    paymentReceiptFile?: File | null;
  }
) => {
  const formData = new FormData();

  if (data.teamName) formData.append('teamName', data.teamName);
  if (data.captainName) formData.append('captainName', data.captainName);
  if (data.coachName) formData.append('coachName', data.coachName);
  if (data.managerName) formData.append('managerName', data.managerName);
  if (data.contactNumber) formData.append('contactNumber', data.contactNumber);
  if (Array.isArray(data.players)) formData.append('players', JSON.stringify(data.players));
  if (data.teamLogoFile instanceof File) formData.append('teamLogo', data.teamLogoFile);
  if (data.paymentReceiptFile instanceof File) formData.append('paymentReceipt', data.paymentReceiptFile);

  const res = await api.put(`${TEAMS_ENDPOINT}/${teamId}`, formData, {
    headers: getAuthHeaders(true),
  });
  return res.data;
};

// ✅ Delete a team
export const deleteTeam = async (id: string) => {
  const res = await api.delete(`${TEAMS_ENDPOINT}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Approve/verify a team
export const verifyTeam = async (id: string) => {
  const res = await api.patch(`${TEAMS_ENDPOINT}/${id}/verify`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Reject a team
export const rejectTeam = async (id: string) => {
  const res = await api.patch(`${TEAMS_ENDPOINT}/${id}/reject`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
