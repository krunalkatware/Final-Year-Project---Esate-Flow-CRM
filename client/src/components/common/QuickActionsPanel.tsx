import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Search, Users, Home, Calendar, DollarSign,
  FileText, MapPin, Zap, ChevronRight, TrendingUp,
  Phone, Mail, Star, Building2, BarChart3
} from 'lucide-react';
import { apiClient } from '../../api/axios';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  gradient: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Users,
    label: 'New Lead',
    description: 'Add a new customer lead to CRM',
    path: '/admin/crm/leads',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    shortcut: 'L',
  },
  {
    icon: Calendar,
    label: 'Book Site Visit',
    description: 'Schedule a new property visit',
    path: '/admin/site-visits/new',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    shortcut: 'V',
  },
  {
    icon: FileText,
    label: 'Create Booking',
    description: 'Process a new property booking',
    path: '/admin/bookings/new',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    shortcut: 'B',
  },
  {
    icon: Home,
    label: 'Add Property',
    description: 'List a new property on the platform',
    path: '/admin/properties/create',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-600',
    shortcut: 'P',
  },
  {
    icon: Building2,
    label: 'Add Builder',
    description: 'Register a new builder / developer',
    path: '/admin/builders/create',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-700',
    shortcut: 'D',
  },
  {
    icon: DollarSign,
    label: 'Revenue Dashboard',
    description: 'View commissions and wallet summary',
    path: '/admin/revenue',
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-700',
    shortcut: 'R',
  },
];

interface RecentActivity {
  id: number;
  type: 'lead' | 'visit' | 'booking' | 'review';
  title: string;
  subtitle: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

export const QuickActionsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [liveStat, setLiveStat] = useState<{ leads: number; visits: number; revenue: string } | null>(null);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setSearchQuery('');
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch live stats
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    apiClient.get('/admin/dashboard/summary', { headers })
      .then(res => {
        const d = res.data;
        setLiveStat({
          leads: d.active_leads || d.total_leads || 0,
          visits: d.pending_site_visits?.value || d.pending_site_visits || 0,
          revenue: d.revenue?.formatted || `₹${((d.total_revenue || 0) / 10000000).toFixed(1)}Cr`,
        });
      })
      .catch(() => {});

    // Mock recent activity for now
    setRecentActivity([
      { id: 1, type: 'lead', title: 'New Lead Added', subtitle: 'Alice Kumar — Budget ₹50L', time: '2m ago', icon: Users, color: '#6366f1' },
      { id: 2, type: 'visit', title: 'Site Visit Scheduled', subtitle: 'Skyline 3BHK — Tomorrow 10AM', time: '15m ago', icon: MapPin, color: '#10b981' },
      { id: 3, type: 'booking', title: 'Booking Confirmed', subtitle: 'Ocean View Villa — ₹3.5Cr', time: '1h ago', icon: FileText, color: '#f59e0b' },
      { id: 4, type: 'review', title: 'New Review Posted', subtitle: 'Ravi Mehta gave 5⭐', time: '2h ago', icon: Star, color: '#eab308' },
    ]);
  }, [open]);

  const filteredActions = QUICK_ACTIONS.filter(a =>
    !searchQuery ||
    a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (action: QuickAction) => {
    navigate(action.path);
    setOpen(false);
  };

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip */}
        {!open && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/50 rounded-lg text-xs text-slate-300 backdrop-blur-sm shadow-lg">
            <Zap size={12} className="text-indigo-400" />
            <span>Quick Actions</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px] font-mono">⌘K</kbd>
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
            open
              ? 'bg-red-500 hover:bg-red-600 rotate-45 shadow-red-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-violet-600 hover:scale-110 shadow-indigo-500/30'
          }`}
          title="Quick Actions (Ctrl+K)"
        >
          {open ? <X size={22} className="text-white" /> : <Plus size={22} className="text-white" />}
        </button>
      </div>

      {/* Panel Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          <div
            ref={panelRef}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Quick Actions</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search actions..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
              {/* Live Stats Bar */}
              {liveStat && !searchQuery && (
                <div className="grid grid-cols-3 gap-1 p-3 border-b border-slate-800">
                  {[
                    { label: 'Active Leads', value: liveStat.leads, icon: Users, color: '#6366f1' },
                    { label: 'Pending Visits', value: liveStat.visits, icon: Calendar, color: '#10b981' },
                    { label: 'Revenue', value: liveStat.revenue, icon: TrendingUp, color: '#f59e0b' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-2 rounded-xl bg-slate-800/50">
                      <stat.icon size={14} className="mx-auto mb-1" style={{ color: stat.color }} />
                      <p className="text-xs font-bold text-white truncate">{stat.value}</p>
                      <p className="text-[9px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Grid */}
              <div className="p-3 space-y-1">
                {!searchQuery && (
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Actions</p>
                )}
                {filteredActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => handleAction(action)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-all group text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <action.icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{action.label}</p>
                      <p className="text-xs text-slate-400 truncate">{action.description}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
                {filteredActions.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm">No actions match "{searchQuery}"</div>
                )}
              </div>

              {/* Recent Activity */}
              {!searchQuery && recentActivity.length > 0 && (
                <div className="border-t border-slate-800 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Recent Activity</p>
                  <div className="space-y-1">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activity.color + '22' }}>
                          <activity.icon size={13} style={{ color: activity.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{activity.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{activity.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Press <kbd className="px-1 bg-slate-800 rounded text-slate-400 font-mono">Esc</kbd> to close</span>
              <button onClick={() => { navigate('/admin/dashboard'); setOpen(false); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <BarChart3 size={10} /> Full Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
