import { apiClient as api } from './axios';

export interface LeadItem {
  id: number;
  uuid: string;
  lead_number: string;
  customer_id?: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone: string;
  alternate_phone?: string;
  occupation?: string;
  city?: string;
  locality?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_bhk?: string;
  preferred_property_type?: string;
  buying_timeline?: string;
  investment_purpose?: string;
  property_id?: number;
  property_name?: string;
  builder_id?: number;
  builder_name?: string;
  stage: string;
  source: string;
  priority: string;
  lead_score: number;
  estimated_deal_value: number;
  loss_reason?: string;
  notes_summary?: string;
  assigned_to_id?: number;
  assigned_agent_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  summary: {
    total_leads: number;
    new_leads_today: number;
    hot_leads: number;
    lost_leads: number;
    booked_leads: number;
    conversion_rate: number;
    estimated_pipeline_value: number;
    pending_reminders: number;
  };
  sales_funnel: Record<string, number>;
  lead_sources: { source: string; count: number }[];
}

export const adminCRMApi = {
  getStats: async (): Promise<CRMStats> => {
    const res = await api.get('/admin/leads/crm-stats');
    return res.data;
  },

  getLeads: async (params?: Record<string, any>) => {
    const res = await api.get('/admin/leads', { params });
    return res.data;
  },

  getLeadDetail: async (id: number) => {
    const res = await api.get(`/admin/leads/${id}`);
    return res.data;
  },

  createLead: async (data: any) => {
    const res = await api.post('/admin/leads', data);
    return res.data;
  },

  updateLead: async (id: number, data: any) => {
    const res = await api.put(`/admin/leads/${id}`, data);
    return res.data;
  },

  updateStage: async (id: number, stage: string, notes?: string) => {
    const res = await api.patch(`/admin/leads/${id}/stage`, { stage, notes });
    return res.data;
  },

  addNote: async (id: number, content: string, is_pinned = false) => {
    const res = await api.post(`/admin/leads/${id}/notes`, { content, is_pinned });
    return res.data;
  },

  addReminder: async (id: number, data: { title: string; reminder_type: string; due_date: string; notes?: string }) => {
    const res = await api.post(`/admin/leads/${id}/reminders`, data);
    return res.data;
  },

  deleteLead: async (id: number) => {
    const res = await api.delete(`/admin/leads/${id}`);
    return res.data;
  },

  exportCSV: async () => {
    const res = await api.get('/admin/leads/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `estateflow_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getCustomers: async (params?: Record<string, any>) => {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },

  getCustomer360: async (userId: string | number) => {
    const res = await api.get(`/admin/customers/${userId}`);
    return res.data;
  },

  getCustomerDetail: async (id: string | number) => {
    const res = await api.get(`/admin/customers/${id}`);
    return res.data;
  },

  verifyCustomerDoc: async (userId: string | number, docId: number, notes?: string) => {
    const res = await api.patch(`/admin/customers/${userId}/documents/${docId}/verify`, { notes });
    return res.data;
  },

  rejectCustomerDoc: async (userId: string | number, docId: number, rejection_reason: string) => {
    const res = await api.patch(`/admin/customers/${userId}/documents/${docId}/reject`, { rejection_reason });
    return res.data;
  },

  scheduleCustomerVisit: async (userId: string | number, data: {
    property_id: number;
    scheduled_date: string;
    scheduled_time?: string;
    notes?: string;
    visit_type?: string;
  }) => {
    const res = await api.post(`/admin/customers/${userId}/site-visits`, data);
    return res.data;
  },

  updateCustomerVisitStatus: async (userId: string | number, visitId: number, data: {
    status: string;
    notes?: string;
    reschedule_date?: string;
  }) => {
    const res = await api.patch(`/admin/customers/${userId}/site-visits/${visitId}`, data);
    return res.data;
  },
};


