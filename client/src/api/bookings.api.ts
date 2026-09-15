import { apiClient } from './axios';
import { Booking, BookingCreateData } from '../types/booking';

export const bookingsApi = {
  createBooking: async (data: BookingCreateData): Promise<{ message: string; booking_number: string; booking_id: number }> => {
    const res = await apiClient.post('/bookings', data);
    return res.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const res = await apiClient.get('/bookings');
    return res.data;
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data;
  },

  cancelBooking: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/bookings/${id}`);
    return res.data;
  },

  /** Create Razorpay payment order for a booking */
  createPaymentOrder: async (bookingId: number): Promise<{
    mode: 'live' | 'unconfigured' | 'demo';
    razorpay_order_id: string;
    razorpay_key_id: string;
    amount: number;
    amount_paise: number;
    currency: string;
    booking_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    notice?: string;
  }> => {
    const res = await apiClient.post(`/bookings/${bookingId}/create-payment-order`);
    return res.data;
  },

  /** Verify payment signature and confirm booking */
  verifyPayment: async (
    bookingId: number,
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      payment_method?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    booking_number: string;
    booking_id: number;
    payment_number: string;
    amount_paid: number;
    transaction_reference: string;
    mode: string;
    status: string;
  }> => {
    const res = await apiClient.post(`/bookings/${bookingId}/verify-payment`, payload);
    return res.data;
  },
};

