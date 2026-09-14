import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/wishlist.api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../contexts/ToastContext';

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlist,
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: wishlistApi.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Added to wishlist!');
    },
    onError: () => {
      toast.error('Failed to add to wishlist');
    },
  });

  const removeMutation = useMutation({
    mutationFn: wishlistApi.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Removed from wishlist');
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  const isWishlisted = (propertyId: number): boolean => {
    return wishlist.some((item) => item.property_id === propertyId);
  };

  const toggleWishlist = (propertyId: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist');
      return;
    }

    if (isWishlisted(propertyId)) {
      removeMutation.mutate(propertyId);
    } else {
      addMutation.mutate(propertyId);
    }
  };

  return {
    wishlist,
    isLoading,
    isWishlisted,
    toggleWishlist,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
  };
};
