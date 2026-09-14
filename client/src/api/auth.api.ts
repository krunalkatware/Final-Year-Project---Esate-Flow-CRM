import { apiClient } from './axios';
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth';
import { User } from '../types/user';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', credentials);
    return res.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    }
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  getGoogleConfig: async (): Promise<{ configured: boolean; client_id: string | null }> => {
    const res = await apiClient.get('/auth/google/config');
    return res.data;
  },

  googleAuth: async (payload: {
    credential?: string;
    google_id_token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/google', payload);
    return res.data;
  },
};

