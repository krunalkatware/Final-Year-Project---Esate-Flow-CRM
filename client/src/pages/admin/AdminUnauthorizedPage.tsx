import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { ShieldOff, ArrowLeft, LogIn } from 'lucide-react';
import { ADMIN_ROLE_LABELS } from '../../types/admin';

export const AdminUnauthorizedPage: React.FC = () => {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const roleLabel = adminUser
    ? ADMIN_ROLE_LABELS[adminUser.admin_role] ?? adminUser.admin_role_display
    : 'Unknown';

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-error/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-md w-full">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-red-950/60 border border-red-800/50 flex items-center justify-center">
          <ShieldOff className="w-9 h-9 text-error" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-5xl font-heading font-extrabold text-white">403</h1>
          <h2 className="text-xl font-heading font-bold text-slate-200">Access Denied</h2>
          {adminUser && (
            <p className="text-sm text-slate-400">
              Your role (<span className="font-semibold text-slate-300">{roleLabel}</span>) does not have
              permission to access this section.
            </p>
          )}
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Contact a Super Admin to request elevated permissions for your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            id="admin-unauthorized-logout"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-600 shadow-glow-primary transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in as different user
          </button>
        </div>
      </div>
    </div>
  );
};
