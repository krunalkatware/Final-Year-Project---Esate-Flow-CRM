export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  booking_number: string;
  property_id: number;
  property_name?: string;
  property_locality?: string;
  property_city?: string;
  property_image?: string;
  property_price?: number;
  status: BookingStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_visit_date?: string;
  visit_time_slot?: string;
  special_requirements?: string;
  created_at: string;
  updated_at?: string;
}

export interface BookingCreateData {
  property_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  pan_number?: string;
  aadhaar_number?: string;
  preferred_visit_date?: string;
  visit_time_slot?: string;
  special_requirements?: string;
  documents?: Array<{
    document_type: string;
    title: string;
    file_name: string;
    file_url: string;
    mime_type?: string;
    file_size_bytes?: number;
  }>;
}


export interface WishlistItem {
  id: number;
  property_id: number;
  property_name?: string;
  property_locality?: string;
  property_city?: string;
  property_price?: number;
  property_image?: string;
  property_bedrooms?: number;
  property_bathrooms?: number;
  property_area_sqft?: number;
  property_status?: string;
  property_builder?: string;
  property_slug?: string;
  property_rating?: number;
  created_at: string;
}

export interface Review {
  id: number;
  property_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  is_verified: boolean;
  created_at: string;
}
