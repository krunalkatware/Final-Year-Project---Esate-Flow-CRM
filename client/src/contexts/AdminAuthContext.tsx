import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser, AdminPermission, AdminLoginCredentials } from '../types/admin';
import { adminAuthApi } from '../api/admin-auth.api';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (credentials: AdminLoginCredentials) => Promise<void>;
  adminGoogleLogin: (payload: {
    credential?: string;
    google_id_token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }) => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshAdminUser: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const initAdminAuth = async () => {
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        try {
          const userData = await adminAuthApi.getMe();
          setAdminUser(userData);
        } catch {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
        }
      }
      setIsLoading(false);
    };
    initAdminAuth();
  }, []);

  const adminLogin = async (credentials: AdminLoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await adminAuthApi.login(credentials);
      localStorage.setItem('admin_access_token', res.access_token);
      localStorage.setItem('admin_refresh_token', res.refresh_token);
      setAdminUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const adminGoogleLogin = async (payload: {
    credential?: string;
    google_id_token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await adminAuthApi.googleLogin(payload);
      localStorage.setItem('admin_access_token', res.access_token);
      localStorage.setItem('admin_refresh_token', res.refresh_token);
      setAdminUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };


  const adminLogout = async () => {
    setIsLoading(true);
    try {
      await adminAuthApi.logout();
    } catch {
      // Ignore — still clear local state
    } finally {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      setAdminUser(null);
      setIsLoading(false);
    }
  };

  const refreshAdminUser = useCallback(async () => {
    try {
      const userData = await adminAuthApi.getMe();
      setAdminUser(userData);
    } catch {
      setAdminUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!adminUser) return false;
      if (adminUser.permissions.includes('manage_all')) return true;
      return adminUser.permissions.includes(permission);
    },
    [adminUser]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        adminLogin,
        adminGoogleLogin,
        adminLogout,
        refreshAdminUser,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>

  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
