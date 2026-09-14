import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, MapPin, Calendar, CheckCircle, XCircle, Clock,
  ArrowUpRight, Users, Plus, Download, RefreshCw, Star, Navigation
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminSiteVisitsApi } from '../../../api/admin-site-visits.api';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#8b5cf6'];

export default function SiteVisitDashboardPage() {
  const navigate = useNavigate();
  const { data: analytics, loading, refetch } = useQuery(() => adminSiteVisitsApi.getAnalytics());

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading site visits analytics...</p>
      </div>
    </div>
  );

  const summary = analytics?.summary ?? {
    total_visits: 0, today_visits: 0, upcoming_visits: 0, completed: 0,
    cancelled: 0, no_show: 0, conversion_rate: 0, avg_visit_duration: 0
  };
  const statusBreakdown = analytics?.status_breakdown ?? {};
  const leaderboard = analytics?.leaderboard ?? [];

  const kpis = [
    { label: 'Total Visits', value: summary.total_visits, icon: MapPin, color: 'from-indigo-500 to-indigo-700', textColor: 'text-indigo-400' },
    { label: "Today's Visits", value: summary.today_visits, icon: Calendar, color: 'from-amber-500 to-amber-700', textColor: 'text-amber-400' },
    { label: 'Upcoming Scheduled', value: summary.upcoming_visits, icon: Clock, color: 'from-blue-500 to-blue-700', textColor: 'text-blue-400' },
    { label: 'Completed Visits', value: summary.completed, icon: CheckCircle, color: 'from-emerald-500 to-emerald-700', textColor: 'text-emerald-400' },
    { label: 'No Shows', value: summary.no_show, icon: XCircle, color: 'from-red-500 to-red-700', textColor: 'text-red-400' },
    { label: 'Conversion Rate', value: `${summary.conversion_rate}%`, icon: TrendingUp, color: 'from-pink-500 to-pink-700', textColor: 'text-pink-400' },
  ];

  return (
    <div className="space-y-8 p-6 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Visit Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time tracking of properties viewings and customer walkthroughs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => adminSiteVisitsApi.exportCSV()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => navigate('/admin/site-visits/new')} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm">
            <Plus size={16} /> New Site Visit
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 transition-all group" style={{ background: 'var(--bg-card)' }}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${kpi.color} translate-x-6 -translate-y-6`} />
            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} mb-3`}>
              <kpi.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{kpi.value.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Leaderboard */}
        <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-4">Executive Leaderboard (Visits)</h2>
          <div className="space-y-4">
            {leaderboard.length > 0 ? (
              leaderboard.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-700/30 bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {item.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.total} visits assigned</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{item.completed}</div>
                    <div className="text-[10px] text-slate-500">Completed</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-6">No leaderboard data available</div>
            )}
          </div>
        </div>

        {/* Quick Links / Navigation Cards */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-base font-semibold text-white mb-4">Operations Console</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'All Site Visits', desc: 'Browse and search scheduling matrix', path: '/admin/site-visits/list', icon: MapPin, color: 'indigo' },
              { label: 'Visits Calendar', desc: 'Drag-and-drop schedule board', path: '/admin/site-visits/calendar', icon: Calendar, color: 'emerald' },
              { label: 'Analytics Panel', desc: 'Conversion analysis, ranks & heatmaps', path: '/admin/site-visits/analytics', icon: TrendingUp, color: 'pink' },
              { label: 'Route Planner', desc: 'Optimize multiple properties routes', path: '/admin/site-visits/routes', icon: Navigation, color: 'amber' },
            ].map((card, i) => (
              <button key={i} onClick={() => navigate(card.path)}
                className="flex flex-col text-left p-5 rounded-2xl border border-slate-700/50 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40 transition-all group">
                <div className={`p-3 rounded-xl bg-${card.color}-500/10 text-${card.color}-400 group-hover:scale-105 transition-all mb-4 self-start`}>
                  <card.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">{card.label}</h3>
                <p className="text-xs text-slate-400 leading-normal">{card.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
