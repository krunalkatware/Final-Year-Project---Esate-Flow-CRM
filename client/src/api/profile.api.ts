import { apiClient } from './axios';
import { CustomerProfile, SiteVisit, NotificationItem } from '../types/user';

export const profileApi = {
  getProfile: async (): Promise<CustomerProfile> => {
    const res = await apiClient.get('/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<CustomerProfile>): Promise<CustomerProfile> => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/profile/change-password', data);
    return res.data;
  },

  getSiteVisits: async (): Promise<SiteVisit[]> => {
    const res = await apiClient.get('/site-visits');
    return res.data;
  },

  scheduleSiteVisit: async (data: { property_id: number; visit_date: string; time_slot?: string; notes?: string }): Promise<{ message: string; visit_id: number }> => {
    const res = await apiClient.post('/site-visits', data);
    return res.data;
  },

  cancelSiteVisit: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/site-visits/${id}`);
    return res.data;
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  markNotificationRead: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    const res = await apiClient.put('/notifications/mark-all-read');
    return res.data;
  },
};
