import { apiClient as api } from './axios';

export interface BookingItem {
  id: number;
  uuid: string;
  booking_number: string;
  status: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  unit_number?: string;
  floor_number?: number;
  bhk_type?: string;
  super_builtup_area?: number;
  carpet_area?: number;
  net_total: number;
  token_amount: number;
  paid_amount: number;
  remaining_amount: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  property?: {
    id: number;
    title: string;
    city: string;
    price?: number;
  };
  builder?: {
    id: number;
    name: string;
  };
  sales_executive_name?: string;
  created_at: string;
}

export interface BookingDetail extends BookingItem {
  pricing: {
    base_price: number;
    floor_rise_charges: number;
    plc_charges: number;
    parking_charges: number;
    club_membership_charges: number;
    other_charges: number;
    gross_total: number;
    discount_amount: number;
    discount_reason?: string;
    taxable_amount: number;
    gst_amount: number;
    stamp_duty_amount: number;
    registration_charges: number;
    net_total: number;
    token_amount: number;
    booking_amount: number;
    paid_amount: number;
    remaining_amount: number;
  };
  payments: Array<{
    id: number;
    payment_number: string;
    type: string;
    mode: string;
    status: string;
    amount: number;
    total_paid: number;
    ref?: string;
    date: string;
  }>;
  installments: Array<{
    id: number;
    installment_number: number;
    name: string;
    due_amount: number;
    paid_amount: number;
    due_date: string;
    status: string;
  }>;
  documents: Array<{
    id: number;
    title: string;
    type: string;
    file_url: string;
    verified: boolean;
    created_at: string;
  }>;
  timeline: Array<{
    id: number;
    title: string;
    type: string;
    description?: string;
    performed_by: string;
    created_at: string;
  }>;
  comments: Array<{
    id: number;
    author: string;
    content: string;
    created_at: string;
  }>;
  agreements: Array<{
    id: number;
    number: string;
    status: string;
    signed_customer: boolean;
    signed_builder: boolean;
  }>;
}

export interface BookingAnalytics {
  summary: {
    total_bookings: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    total_revenue: number;
    estimated_pipeline_value: number;
    token_revenue: number;
    avg_booking_value?: number;
    active_pipeline_count?: number;
  };
  status_breakdown: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  builder_breakdown?: Record<string, { count: number; revenue: number }>;
}

export const adminBookingsApi = {
  getBookings: async (params?: Record<string, any>) => {
    const res = await api.get('/admin/bookings', { params });
    return res.data;
  },

  getBookingDetail: async (id: number): Promise<BookingDetail> => {
    const res = await api.get(`/admin/bookings/${id}`);
    return res.data;
  },

  // Alias used by detail page
  getBooking: async (id: number) => {
    const res = await api.get(`/admin/bookings/${id}`);
    return res.data;
  },

  getAuditLogs: async (params?: Record<string, any>) => {
    const res = await api.get('/admin/bookings/audit-logs', { params });
    return res.data;
  },

  downloadAgreement: async (id: number) => {
    const res = await api.get(`/admin/bookings/${id}/agreement-pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agreement_booking_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getAnalytics: async (): Promise<BookingAnalytics> => {
    const res = await api.get('/admin/bookings/analytics');
    return res.data;
  },

  getCalendar: async () => {
    const res = await api.get('/admin/bookings/calendar');
    return res.data;
  },

  createBooking: async (data: any) => {
    const res = await api.post('/admin/bookings', data);
    return res.data;
  },

  updateStatus: async (id: number, status: string, reason?: string) => {
    const res = await api.patch(`/admin/bookings/${id}/status`, { status, reason });
    return res.data;
  },

  approveBooking: async (id: number) => {
    const res = await api.patch(`/admin/bookings/${id}/approve`);
    return res.data;
  },

  rejectBooking: async (id: number, reason: string) => {
    const res = await api.patch(`/admin/bookings/${id}/reject`, { reason });
    return res.data;
  },

  cancelBooking: async (id: number, reason: string) => {
    const res = await api.patch(`/admin/bookings/${id}/cancel`, { reason });
    return res.data;
  },

  completeBooking: async (id: number) => {
    const res = await api.patch(`/admin/bookings/${id}/complete`);
    return res.data;
  },

  generateAgreement: async (id: number) => {
    const res = await api.patch(`/admin/bookings/${id}/generate-agreement`);
    return res.data;
  },

  recordPayment: async (id: number, data: any) => {
    const res = await api.post(`/admin/bookings/${id}/payments`, data);
    return res.data;
  },

  addComment: async (id: number, comment: string, is_internal = true) => {
    const res = await api.post(`/admin/bookings/${id}/comments`, { comment, is_internal });
    return res.data;
  },

  exportCSV: async () => {
    const res = await api.get('/admin/bookings/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `estateflow_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  bulkDelete: async (booking_ids: number[]) => {
    const res = await api.post('/admin/bookings/bulk-delete', { booking_ids });
    return res.data;
  },

  bulkApprove: async (booking_ids: number[]) => {
    const res = await api.post('/admin/bookings/bulk-approve', { booking_ids });
    return res.data;
  },
};
