import { apiClient } from './axios';
import { WishlistItem } from '../types/booking';

export const wishlistApi = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    const res = await apiClient.get('/wishlist');
    return res.data;
  },

  addToWishlist: async (propertyId: number): Promise<{ message: string; wishlist_id: number }> => {
    const res = await apiClient.post('/wishlist', { property_id: propertyId });
    return res.data;
  },

  removeFromWishlist: async (propertyId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/wishlist/${propertyId}`);
    return res.data;
  },
};
