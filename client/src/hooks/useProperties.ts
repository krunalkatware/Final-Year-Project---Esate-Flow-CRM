import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties.api';
import { PropertyFilterParams } from '../types/property';

export const useProperties = (filters?: PropertyFilterParams) => {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.getProperties(filters),
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
};

export const useFeaturedProperties = () => {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: propertiesApi.getFeaturedProperties,
    staleTime: 1000 * 60 * 10,
  });
};

export const usePropertyDetail = (id: number | string) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getPropertyById(id),
    enabled: !!id,
  });
};
