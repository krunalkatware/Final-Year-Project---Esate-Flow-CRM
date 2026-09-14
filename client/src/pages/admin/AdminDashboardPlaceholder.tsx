import React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, Lock, LogOut, Building2 } from 'lucide-react';
import { ADMIN_ROLE_COLORS, ADMIN_ROLE_LABELS } from '../../types/admin';

export const AdminDashboardPlaceholder: React.FC = () => {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const roleLabel = adminUser
    ? ADMIN_ROLE_LABELS[adminUser.admin_role] ?? adminUser.admin_role_display
    : '';
  const roleColor = adminUser
    ? ADMIN_ROLE_COLORS[adminUser.admin_role] ?? 'bg-slate-100 text-slate-700'
    : '';

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-extrabold text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Step 1 complete — Authentication & RBAC system is live.
        </p>
      </div>

      {/* Auth success card */}
      <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-6 flex items-start gap-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-300">
            Authentication Verified Successfully
          </p>
          <p className="text-xs text-emerald-600">
            Your JWT access token contains role + permissions claims. RBAC is enforced on all admin endpoints.
          </p>
        </div>
      </div>

      {/* Admin info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User card */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Authenticated Admin
          </div>
          <div>
            <p className="text-base font-bold text-white">{adminUser?.full_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{adminUser?.email}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
            <Shield className="w-3 h-3" />
            {roleLabel}
          </span>
        </div>

        {/* Permissions card */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Permissions ({adminUser?.permissions.length ?? 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {adminUser?.permissions.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
              >
                {p.replace('manage_', '')}
              </span>
            ))}
          </div>
        </div>

        {/* System card */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            CRM Status
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Step 1: Admin Auth</span>
              <span className="text-emerald-400 font-semibold">✓ Done</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Step 2: CRM Dashboard</span>
              <span className="text-slate-600 font-semibold">Pending</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Step 3: Lead Management</span>
              <span className="text-slate-600 font-semibold">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="text-xs text-slate-600 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="font-semibold text-slate-400 mb-1">📋 Step 1 Scope</p>
        <p>This page is a placeholder stub confirming that admin auth works end-to-end. The full CRM dashboard will be implemented in Step 2 as per the project plan.</p>
      </div>
    </div>
  );
};
