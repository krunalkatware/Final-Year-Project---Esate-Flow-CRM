import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  TrendingUp, BookOpen, Clock, CheckCircle, XCircle, DollarSign,
  ArrowUpRight, Building2, Users, FileText, Plus, Download, RefreshCw,
  AlertTriangle, IndianRupee, Calendar, Layers
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  requested: '#3b82f6',
  pending_approval: '#f59e0b',
  approved: '#10b981',
  agreement_generated: '#8b5cf6',
  payment_pending: '#f97316',
  token_paid: '#06b6d4',
  installment_running: '#14b8a6',
  completed: '#22c55e',
  rejected: '#ef4444',
  cancelled: '#dc2626',
  refund_initiated: '#ec4899',
  refund_completed: '#a855f7',
  expired: '#9ca3af',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#8b5cf6'];

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function BookingDashboardPage() {
  const navigate = useNavigate();
  const { data: analytics, loading, refetch } = useQuery(() => adminBookingsApi.getAnalytics());

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading booking analytics...</p>
      </div>
    </div>
  );

  const summary = analytics?.summary ?? {
    total_bookings: 0, pending: 0, approved: 0, completed: 0, cancelled: 0,
    total_revenue: 0, estimated_pipeline_value: 0, token_revenue: 0,
    avg_booking_value: 0, active_pipeline_count: 0,
  };
  const statusBreakdown: Record<string, number> = analytics?.status_breakdown ?? {};
  const monthlyTrends = analytics?.monthly_trends ?? [];

  const kpis = [
    { label: 'Total Bookings', value: summary.total_bookings || 0, icon: BookOpen, color: 'from-indigo-500 to-indigo-700', textColor: 'text-indigo-400', change: '+12%' },
    { label: 'Pending Approval', value: summary.pending || 0, icon: Clock, color: 'from-amber-500 to-amber-700', textColor: 'text-amber-400', change: '+3' },
    { label: 'Approved / Active', value: summary.approved || 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-700', textColor: 'text-emerald-400', change: '+5' },
    { label: 'Completed', value: summary.completed || 0, icon: TrendingUp, color: 'from-violet-500 to-violet-700', textColor: 'text-violet-400', change: '+2' },
    { label: 'Cancelled', value: summary.cancelled || 0, icon: XCircle, color: 'from-red-500 to-red-700', textColor: 'text-red-400', change: '-1' },
    { label: 'Total Revenue', value: formatCurrency(summary.total_revenue || 0), icon: IndianRupee, color: 'from-green-500 to-green-700', textColor: 'text-green-400', change: '+18%', raw: true },
    { label: 'Token Revenue', value: formatCurrency(summary.token_revenue || 0), icon: DollarSign, color: 'from-cyan-500 to-cyan-700', textColor: 'text-cyan-400', change: '+9%', raw: true },
    { label: 'Pipeline Value', value: formatCurrency(summary.estimated_pipeline_value || 0), icon: Layers, color: 'from-pink-500 to-pink-700', textColor: 'text-pink-400', change: '+22%', raw: true },
  ];

  const pieData = Object.entries(statusBreakdown).map(([key, val]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    value: val as number,
  }));

  return (
    <div className="space-y-8 p-6 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time enterprise booking analytics & overview</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => adminBookingsApi.exportCSV()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => navigate('/admin/bookings/new')} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all group" style={{ background: 'var(--bg-card)' }}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${kpi.color} translate-x-6 -translate-y-6`} />
            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} mb-3`}>
              <kpi.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{kpi.raw ? kpi.value : kpi.value.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{kpi.label}</div>
            <div className={`text-xs mt-2 font-medium ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              <ArrowUpRight size={12} className="inline" /> {kpi.change} this month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-4">Monthly Booking & Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Bookings" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Revenue (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown Pie */}
        <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-4">Booking Status Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">No booking data</div>
          )}
          <div className="mt-2 space-y-1">
            {pieData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-400 truncate max-w-24">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Bookings', icon: BookOpen, path: '/admin/bookings/list', color: 'indigo' },
          { label: 'Analytics', icon: TrendingUp, path: '/admin/bookings/analytics', color: 'violet' },
          { label: 'Payment Calendar', icon: Calendar, path: '/admin/bookings/calendar', color: 'cyan' },
          { label: 'Audit Logs', icon: FileText, path: '/admin/bookings/audit', color: 'amber' },
        ].map((action, i) => (
          <button key={i} onClick={() => navigate(action.path)}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-700/50 hover:border-${action.color}-500/50 hover:bg-slate-800/50 transition-all group text-center`}
            style={{ background: 'var(--bg-card)' }}>
            <div className={`p-3 rounded-xl bg-${action.color}-500/10 group-hover:bg-${action.color}-500/20 transition-all`}>
              <action.icon size={20} className={`text-${action.color}-400`} />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
