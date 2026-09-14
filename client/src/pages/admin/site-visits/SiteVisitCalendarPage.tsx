import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Filter, AlertTriangle, User, Home, ArrowLeft, RefreshCw
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminSiteVisitsApi } from '../../../api/admin-site-visits.api';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'border-blue-500 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
  cancelled: 'border-red-500 bg-red-500/10 text-red-300',
  rescheduled: 'border-amber-500 bg-amber-500/10 text-amber-300',
  in_transit: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
  arrived: 'border-purple-500 bg-purple-500/10 text-purple-300',
  no_show: 'border-rose-500 bg-rose-500/10 text-rose-300',
};

export default function SiteVisitCalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');

  const { data, loading, refetch } = useQuery(() => adminSiteVisitsApi.getCalendar());

  const events = data?.events ?? [];

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const renderMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const grid = [...blanks, ...days];

    return (
      <div className="grid grid-cols-7 gap-1 border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900/20">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-3 text-center text-xs font-semibold text-slate-500 border-b border-slate-700/50 uppercase tracking-wider bg-slate-800/40">
            {d}
          </div>
        ))}
        {grid.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} className="p-4 border border-slate-800 bg-slate-950/20 min-h-24" />;
          
          const dateStr = day.toISOString().split('T')[0];
          const dayEvents = events.filter((e: any) => e.start.startsWith(dateStr));
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div key={dateStr} className={`p-2 border border-slate-800/50 min-h-24 bg-slate-900/10 hover:bg-slate-800/30 transition-all ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-semibold ${isToday ? 'w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center' : 'text-slate-400'}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-16">
                {dayEvents.map((e: any) => {
                  const statusCls = STATUS_COLORS[e.status] ?? 'border-slate-500 bg-slate-500/10 text-slate-300';
                  return (
                    <button key={e.id} onClick={() => navigate(`/admin/site-visits/${e.id}`)}
                      className={`w-full text-left truncate text-[10px] p-1 rounded border leading-tight ${statusCls}`}>
                      {e.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgenda = () => {
    return (
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center p-10 text-slate-500 rounded-2xl border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
            <CalendarIcon size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No scheduled visits on calendar</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
            <div className="divide-y divide-slate-800">
              {events.map((e: any) => {
                const statusCls = STATUS_COLORS[e.status] ?? 'border-slate-500 bg-slate-500/10 text-slate-300';
                return (
                  <div key={e.id} onClick={() => navigate(`/admin/site-visits/${e.id}`)}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 hover:bg-slate-800/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full border ${statusCls.split(' ')[0]}`} />
                      <div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{e.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(e.start).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}</span>
                          <span className="flex items-center gap-1"><User size={12} /> {e.executive}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${statusCls} mt-2 md:mt-0`}>
                      {e.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate('/admin/site-visits')} className="hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft size={14} /> Site Visits Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Visits Calendar</h1>
          <p className="text-slate-400 mt-1">Conflict checking scheduler with color-coded appointment statuses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all">
            <RefreshCw size={16} />
          </button>
          <div className="flex rounded-xl border border-slate-700 overflow-hidden bg-slate-900/30">
            {['month', 'agenda'].map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                  viewMode === mode ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigator Bar */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-700/50 bg-slate-900/20">
          <button onClick={handlePrev} className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-all">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNext} className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Main Calendar Render */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'month' ? (
        renderMonthDays()
      ) : (
        renderAgenda()
      )}
    </div>
  );
}
