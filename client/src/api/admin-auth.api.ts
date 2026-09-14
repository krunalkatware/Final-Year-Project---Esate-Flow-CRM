import axios from 'axios';
import { AdminAuthResponse, AdminLoginCredentials, AdminUser } from '../types/admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Separate Axios instance for admin — uses admin_* localStorage keys ──────
export const adminApiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin access token on every request
adminApiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('admin_access_token') ||
      localStorage.getItem('estateflow_admin_access_token') ||
      localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh on 401 — redirect to /admin/login on failure
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/admin/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefreshToken } = res.data;
          localStorage.setItem('admin_access_token', access_token);
          localStorage.setItem('admin_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return adminApiClient(originalRequest);
        } catch {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          window.location.href = '/admin/login';
        }
      } else {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Admin Auth API Functions ─────────────────────────────────────────────────
export const adminAuthApi = {
  login: async (credentials: AdminLoginCredentials): Promise<AdminAuthResponse> => {
    const res = await adminApiClient.post('/admin/auth/login', credentials);
    return res.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (refreshToken) {
      await adminApiClient.post('/admin/auth/logout', { refresh_token: refreshToken });
    }
  },

  refresh: async (): Promise<AdminAuthResponse> => {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    const res = await adminApiClient.post('/admin/auth/refresh', {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  getMe: async (): Promise<AdminUser> => {
    const res = await adminApiClient.get('/admin/auth/me');
    return res.data;
  },

  googleLogin: async (payload: {
    credential?: string;
    google_id_token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }): Promise<AdminAuthResponse> => {
    const res = await adminApiClient.post('/admin/auth/google', payload);
    return res.data;
  },
};

