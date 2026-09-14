export type PropertyType = 'apartment' | 'villa' | 'penthouse' | 'plot' | 'commercial' | 'studio';

export type PropertyStatus = 'available' | 'reserved' | 'booked' | 'sold';

export interface PropertyImage {
  id: number;
  url: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Builder {
  id: number;
  name: string;
  logo_url?: string;
  description?: string;
  rating: number;
  total_projects: number;
  delivered_projects: number;
  headquarters?: string;
  established_year?: number;
  is_verified: boolean;
}

export interface City {
  id: number;
  name: string;
  state: string;
}

export interface PropertyListItem {
  id: number;
  name: string;
  slug: string;
  property_type: PropertyType;
  status: PropertyStatus;
  locality?: string;
  city?: string;
  builder_name?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  price: number;
  price_per_sqft?: number;
  possession_date?: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  primary_image?: string;
  expected_roi?: number;
  is_wishlisted?: boolean;
}

export interface PropertyDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  property_type: PropertyType;
  status: PropertyStatus;
  locality?: string;
  full_address?: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  total_floors?: number;
  floor_number?: number;
  parking_spots: number;
  facing?: string;
  furnishing?: string;
  price: number;
  price_per_sqft?: number;
  maintenance_monthly?: number;
  possession_date?: string;
  rating: number;
  review_count: number;
  view_count: number;
  is_featured: boolean;
  is_verified: boolean;
  rera_number?: string;
  expected_roi?: number;
  created_at: string;
  carpet_area?: number;
  builtup_area?: number;
  project_name?: string;
  highlights?: { icon: string; title: string; description: string }[];
  nearby_locations?: { category: string; name: string; distance: string }[];
  documents?: { title: string; type: string; size: string; category: string; download_url: string }[];
  images: PropertyImage[];
  amenity_names: string[];
  builder?: Builder;
  city?: City;
  is_wishlisted?: boolean;
}

export interface PropertyFilterParams {
  city?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  builder_id?: number;
  status?: string;
  min_area?: number;
  max_area?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertyListResponse {
  items: PropertyListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
