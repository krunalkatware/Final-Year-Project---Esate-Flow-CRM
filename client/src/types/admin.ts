// Admin TypeScript types for EstateFlow RBAC system

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'sales_manager'
  | 'sales_executive'
  | 'customer_support';

export type AdminPermission =
  | 'manage_all'
  | 'manage_properties'
  | 'manage_builders'
  | 'manage_customers'
  | 'manage_bookings'
  | 'manage_reviews'
  | 'manage_reports'
  | 'manage_leads'
  | 'manage_site_visits'
  | 'manage_booking_status'
  | 'manage_tickets'
  | 'manage_notifications';

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  customer_support: 'Customer Support',
};

export const ADMIN_ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  sales_manager: 'bg-emerald-100 text-emerald-700',
  sales_executive: 'bg-sky-100 text-sky-700',
  customer_support: 'bg-amber-100 text-amber-700',
};

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  admin_role: AdminRole;
  admin_role_display: string;
  permissions: AdminPermission[];
  department?: string;
  phone?: string;
  is_active: boolean;
}

export interface AdminAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AdminUser;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}
