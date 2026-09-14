import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, IndianRupee, BarChart2, PieChartIcon, Download, RefreshCw } from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#a855f7'];

function formatINR(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

export default function BookingAnalyticsPage() {
  const { data: analytics, loading, refetch } = useQuery(() => adminBookingsApi.getAnalytics());

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const summary = analytics?.summary ?? {
    total_bookings: 0, pending: 0, approved: 0, completed: 0, cancelled: 0,
    total_revenue: 0, estimated_pipeline_value: 0, token_revenue: 0,
    avg_booking_value: 0, active_pipeline_count: 0,
  };
  const monthlyTrends = analytics?.monthly_trends ?? [];
  const statusBreakdown: Record<string, number> = analytics?.status_breakdown ?? {};
  const builderBreakdown: Record<string, { count: number; revenue: number }> = analytics?.builder_breakdown ?? {};

  const statusPieData = Object.entries(statusBreakdown).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    value: v,
  }));

  const builderBarData = Object.entries(builderBreakdown).map(([k, v]) => ({
    name: k,
    bookings: v.count || 0,
    revenue: v.revenue || 0,
  }));

  return (
    <div className="space-y-8 p-6" style={{ minHeight: '100vh' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Analytics</h1>
          <p className="text-slate-400 mt-1">Enterprise-grade analytics & business intelligence</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => adminBookingsApi.exportCSV()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-sm">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatINR(summary.total_revenue || 0), color: 'text-emerald-400', sub: 'All time' },
          { label: 'Token Revenue', value: formatINR(summary.token_revenue || 0), color: 'text-cyan-400', sub: 'Token payments' },
          { label: 'Pipeline Value', value: formatINR(summary.estimated_pipeline_value || 0), color: 'text-indigo-400', sub: 'Active pipeline' },
          { label: 'Avg Booking Value', value: formatINR(summary.avg_booking_value || 0), color: 'text-violet-400', sub: 'Per booking' },
        ].map((kpi, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
            <div className="text-xs text-slate-500 mb-1">{kpi.sub}</div>
            <div className={`text-2xl font-bold mb-0.5 ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Trend */}
      <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: 'var(--bg-card)' }}>
        <h2 className="text-base font-semibold text-white mb-5">Monthly Revenue & Booking Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrends}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `${v}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `₹${(v / 1e6).toFixed(0)}M`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="bookings" stroke="#22c55e" fill="url(#bkGrad)" strokeWidth={2} name="Bookings" />
            <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="Revenue (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie */}
        <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-5">Bookings by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#475569' }}>
                {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Builder Bar */}
        <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-5">Bookings by Builder</h2>
          {builderBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={builderBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-500">No builder data</div>
          )}
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-base font-semibold text-white">Key Performance Metrics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Bookings', value: summary.total_bookings || 0 },
              { label: 'Active Pipeline', value: summary.active_pipeline_count || 0 },
              { label: 'Cancelled Rate', value: `${((summary.cancelled || 0) / Math.max(summary.total_bookings || 1, 1) * 100).toFixed(1)}%` },
              { label: 'Completion Rate', value: `${((summary.completed || 0) / Math.max(summary.total_bookings || 1, 1) * 100).toFixed(1)}%` },
            ].map((m, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-slate-800/50">
                <div className="text-2xl font-bold text-white mb-1">{m.value}</div>
                <div className="text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
