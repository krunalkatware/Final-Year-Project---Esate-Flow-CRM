import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, MapPin, Calendar, CheckCircle, XCircle, Clock,
  ArrowUpRight, BarChart, PieChartIcon, Download, RefreshCw, Star
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import useQuery from '../../../hooks/useQuery';
import { adminSiteVisitsApi } from '../../../api/admin-site-visits.api';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#8b5cf6'];

export default function SiteVisitAnalyticsPage() {
  const navigate = useNavigate();
  const { data: analytics, loading, refetch } = useQuery(() => adminSiteVisitsApi.getAnalytics());

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const summary = analytics?.summary ?? {
    total_visits: 0, today_visits: 0, upcoming_visits: 0, completed: 0,
    cancelled: 0, no_show: 0, conversion_rate: 0, avg_visit_duration: 0
  };
  const statusBreakdown = analytics?.status_breakdown ?? {};
  const monthlyTrends = analytics?.monthly_trends ?? [];

  const pieData = Object.entries(statusBreakdown).map(([k, v]) => ({
    name: k.replace(/_/g, ' ').toUpperCase(),
    value: v as number,
  }));

  return (
    <div className="space-y-8 p-6 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Visits Analytics</h1>
          <p className="text-slate-400 mt-1">Visit-to-booking conversions, leaderboards, and schedule funnel charts</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-xs font-semibold">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => adminSiteVisitsApi.exportCSV()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-xs font-semibold">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: summary.total_visits, sub: 'All-time passes' },
          { label: 'Completed Tours', value: summary.completed, sub: 'Successfully viewings' },
          { label: 'No Shows', value: summary.no_show, sub: 'Missed viewings' },
          { label: 'Conversion Rate', value: `${summary.conversion_rate}%`, sub: 'Visit to Booking' },
        ].map((kpi, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
            <div className="text-xs text-slate-500 mb-1">{kpi.sub}</div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-xs text-slate-400 font-semibold">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Volume vs. Completion Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#volGrad)" strokeWidth={2} name="Total Visits" />
              <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#compGrad)" strokeWidth={2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie Chart */}
        <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Tours by Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-500 text-center py-10">No status data available</div>
          )}
          <div className="mt-3 space-y-1.5">
            {pieData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
