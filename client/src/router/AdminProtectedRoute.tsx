import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AdminRole } from '../types/admin';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, adminUser } = useAdminAuth();
  const location = useLocation();

  // Still loading — show a minimal spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Authenticating…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Role restriction check
  if (allowedRoles && adminUser && !allowedRoles.includes(adminUser.admin_role)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <>{children}</>;
};
