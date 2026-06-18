import { api } from './api';

export const login = async (email: string, password: string) => {
  try {
    // Axios automatically JSON-stringifies the body
    const { data } = await api.post('/auth/login', { email, password });

    // ✅ Store token and user info in localStorage
    localStorage.setItem('pplt20_token', data.token); // use the same key everywhere
    localStorage.setItem('pplt20_user', JSON.stringify(data.user));

    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};
