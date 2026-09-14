import { apiClient as api } from './axios';

export interface SiteVisitItem {
  id: number;
  uuid: string;
  visit_number: string;
  status: string;
  priority: string;
  visit_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  property?: {
    id: number;
    title: string;
    locality?: string;
  };
  builder?: {
    id: number;
    name: string;
  };
  sales_executive_name?: string;
}

export interface SiteVisitDetail {
  id: number;
  uuid: string;
  visit_number: string;
  status: string;
  priority: string;
  visit_type: string;
  purpose?: string;
  scheduled_date: string;
  scheduled_time?: string;
  expected_duration: number;
  notes?: string;
  feedback_score?: number;
  conversion_probability: number;
  gps_coordinates?: string;
  pickup_location?: string;
  drop_location?: string;
  transport_required: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  property?: {
    id: number;
    title: string;
    locality?: string;
  };
  builder?: {
    id: number;
    name: string;
  };
  sales_executive?: {
    id: number;
    name: string;
  };
  timeline: Array<{
    id: number;
    title: string;
    description?: string;
    event_type: string;
    performed_by?: string;
    created_at: string;
  }>;
  comments: Array<{
    id: number;
    author: string;
    comment: string;
    created_at: string;
  }>;
  documents: Array<{
    id: number;
    document_name: string;
    document_type?: string;
    file_url: string;
    is_verified: boolean;
  }>;
  feedbacks: Array<{
    id: number;
    rating: number;
    comments?: string;
    created_at: string;
  }>;
  attendance: Array<{
    id: number;
    attendance_status: string;
    marked_time?: string;
    is_gps_verified: boolean;
  }>;
}

export interface SiteVisitAnalytics {
  summary: {
    total_visits: number;
    today_visits: number;
    upcoming_visits: number;
    completed: number;
    cancelled: number;
    no_show: number;
    conversion_rate: number;
    avg_visit_duration: number;
  };
  leaderboard: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
  monthly_trends: Array<{
    month: string;
    visits: number;
    completed: number;
  }>;
  status_breakdown: Record<string, number>;
}

export const adminSiteVisitsApi = {
  getSiteVisits: async (params?: Record<string, any>) => {
    const res = await api.get('/admin/site-visits', { params });
    return res.data;
  },

  getSiteVisitDetail: async (id: number): Promise<SiteVisitDetail> => {
    const res = await api.get(`/admin/site-visits/${id}`);
    return res.data;
  },

  getSiteVisit: async (id: number): Promise<SiteVisitDetail> => {
    const res = await api.get(`/admin/site-visits/${id}`);
    return res.data;
  },

  getAnalytics: async (): Promise<SiteVisitAnalytics> => {
    const res = await api.get('/admin/site-visits/analytics');
    return res.data;
  },

  getCalendar: async () => {
    const res = await api.get('/admin/site-visits/calendar');
    return res.data;
  },

  createSiteVisit: async (data: any) => {
    const res = await api.post('/admin/site-visits', data);
    return res.data;
  },

  updateSiteVisit: async (id: number, data: any) => {
    const res = await api.put(`/admin/site-visits/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: number, status: string, reason?: string) => {
    const res = await api.patch(`/admin/site-visits/${id}/status`, { status, reason });
    return res.data;
  },

  checkIn: async (id: number, coords: { latitude: number; longitude: number; gps_coordinates?: string }) => {
    const res = await api.patch(`/admin/site-visits/${id}/check-in`, coords);
    return res.data;
  },

  checkOut: async (id: number, coords: { latitude: number; longitude: number; gps_coordinates?: string }) => {
    const res = await api.patch(`/admin/site-visits/${id}/check-out`, coords);
    return res.data;
  },

  submitFeedback: async (id: number, data: { rating: number; comments?: string; interested_in_booking?: boolean; next_action?: string }) => {
    const res = await api.patch(`/admin/site-visits/${id}/feedback`, data);
    return res.data;
  },

  markAttendance: async (id: number, data: { sales_executive_id: number; attendance_status: string; latitude?: number; longitude?: number }) => {
    const res = await api.patch(`/admin/site-visits/${id}/attendance`, data);
    return res.data;
  },

  addComment: async (id: number, comment: string, is_internal = true) => {
    const res = await api.post(`/admin/site-visits/${id}/comments`, { comment, is_internal });
    return res.data;
  },

  getRoutePlan: async (id: number) => {
    const res = await api.get(`/admin/site-visits/${id}/route-plan`);
    return res.data;
  },

  exportCSV: async () => {
    const res = await api.get('/admin/site-visits/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `estateflow_site_visits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  bulkDelete: async (visit_ids: number[]) => {
    const res = await api.post('/admin/site-visits/bulk-delete', { visit_ids });
    return res.data;
  },

  bulkAssign: async (visit_ids: number[], sales_executive_id: number) => {
    const res = await api.post('/admin/site-visits/bulk-assign', { visit_ids, sales_executive_id });
    return res.data;
  },
};
