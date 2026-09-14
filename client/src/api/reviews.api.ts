import { apiClient as axiosInstance } from './axios';

export interface ReviewCreatePayload {
  property_id: number;
  rating: number;
  title?: string;
  comment?: string;
  attachment_urls?: string[];
}

export interface ReviewModeratePayload {
  status: 'approved' | 'rejected' | 'flagged' | 'pending';
  moderation_note?: string;
  is_active?: boolean;
  is_spam?: boolean;
}

export interface BulkModeratePayload {
  review_ids: number[];
  action: 'approve' | 'reject' | 'flag' | 'delete' | 'restore';
  note?: string;
}

export interface ReviewReplyPayload {
  reply_text: string;
  is_official?: boolean;
}

export interface ReviewReportPayload {
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'misleading' | 'other';
  details?: string;
}

export const reviewsApi = {
  // Public / Customer Endpoints
  submitReview: async (data: ReviewCreatePayload) => {
    const response = await axiosInstance.post('/reviews', data);
    return response.data;
  },
  createReview: async (data: ReviewCreatePayload) => {
    const response = await axiosInstance.post('/reviews', data);
    return response.data;
  },


  getPropertyReviews: async (propertyId: number, sortBy = 'created_at') => {
    const response = await axiosInstance.get(`/reviews/${propertyId}`, {
      params: { sort_by: sortBy },
    });
    return response.data;
  },

  getBuilderReviews: async (builderId: number) => {
    const response = await axiosInstance.get(`/reviews/builder/${builderId}`);
    return response.data;
  },

  getMyReviews: async () => {
    const response = await axiosInstance.get('/reviews/my-reviews');
    return response.data;
  },

  voteReaction: async (reviewId: number, isHelpful: boolean) => {
    const response = await axiosInstance.post(`/reviews/${reviewId}/reaction`, {
      is_helpful: isHelpful,
    });
    return response.data;
  },

  reportReview: async (reviewId: number, data: ReviewReportPayload) => {
    const response = await axiosInstance.post(`/reviews/${reviewId}/report`, data);
    return response.data;
  },

  // Admin Endpoints
  getAdminReviews: async (params?: Record<string, any>) => {
    const response = await axiosInstance.get('/admin/reviews', { params });
    return response.data;
  },

  getDashboardMetrics: async () => {
    const response = await axiosInstance.get('/admin/reviews/dashboard');
    return response.data;
  },

  getModerationQueue: async () => {
    const response = await axiosInstance.get('/admin/reviews/moderation-queue');
    return response.data;
  },

  getBuilderReputation: async () => {
    const response = await axiosInstance.get('/admin/reviews/builder-reputation');
    return response.data;
  },

  getReviewDetail: async (reviewId: number) => {
    const response = await axiosInstance.get(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  moderateReview: async (reviewId: number, data: ReviewModeratePayload) => {
    const response = await axiosInstance.patch(`/admin/reviews/${reviewId}/moderate`, data);
    return response.data;
  },

  bulkModerateReviews: async (data: BulkModeratePayload) => {
    const response = await axiosInstance.post('/admin/reviews/bulk-moderate', data);
    return response.data;
  },

  postOfficialReply: async (reviewId: number, data: ReviewReplyPayload) => {
    const response = await axiosInstance.post(`/admin/reviews/${reviewId}/reply`, data);
    return response.data;
  },

  deleteReview: async (reviewId: number) => {
    const response = await axiosInstance.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  restoreReview: async (reviewId: number) => {
    const response = await axiosInstance.post(`/admin/reviews/${reviewId}/restore`);
    return response.data;
  },

  exportReviewsCsv: async () => {
    const response = await axiosInstance.get('/admin/reviews/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};
