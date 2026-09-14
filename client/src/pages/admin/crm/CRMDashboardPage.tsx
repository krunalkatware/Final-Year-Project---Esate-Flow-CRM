import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Target, Flame, AlertCircle, CheckCircle2,
  DollarSign, Bell, Plus, Download, Filter, RefreshCw,
  PhoneCall, Calendar, ArrowUpRight, ArrowDownRight, Eye,
  Building2, Clock, Check, ChevronRight, Layers, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { adminCRMApi, CRMStats, LeadItem } from '../../../api/admin-crm.api';
import { toast } from '../../../contexts/ToastContext';

const STAGE_COLORS: Record<string, string> = {
  new: '#6366f1',
  contacted: '#3b82f6',
  interested: '#06b6d4',
  site_visit_scheduled: '#10b981',
  negotiation: '#f59e0b',
  booking_requested: '#f97316',
  booked: '#22c55e',
  lost: '#ef4444',
  closed: '#8b5cf6',
};

const SOURCE_COLORS = ['#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#f97316','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  delta?: string;
  positive?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, delta, positive, onClick }) => (
  <div
    className={`card p-5 border border-border transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</span>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: color + '20' }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
    <div className="text-2xl font-heading font-bold text-text-primary mb-1">{value}</div>
    {delta && (
      <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}`}>
        {positive && <ArrowUpRight className="w-3 h-3" />}
        {delta}
      </div>
    )}
  </div>
);

export default function CRMDashboardPage() {
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, leadsData] = await Promise.all([
        adminCRMApi.getStats(),
        adminCRMApi.getLeads({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);
      setStats(statsData);
      setRecentLeads(leadsData.items || []);
    } catch (e) {
      console.error('Failed to load CRM dashboard data', e);
      toast.error('Failed to load CRM stats');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminCRMApi.exportCSV();
      toast.success('Leads CSV exported successfully');
    } catch (e) {
      toast.error('Failed to export leads');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (v: number) => {
    if (!v || v <= 0) return '₹0';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const funnelData = stats
    ? Object.entries(stats.sales_funnel).map(([stage, count]) => ({
        name: stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        rawStage: stage,
        count: count,
        fill: STAGE_COLORS[stage] || '#6366f1',
      }))
    : [];

  const sourceData = stats?.lead_sources || [];

  // Stage conversion comparison trend data
  const conversionTrend = [
    { name: 'New Inbound', value: stats?.summary.total_leads || 0, fill: '#6366f1' },
    { name: 'High Priority', value: stats?.summary.hot_leads || 0, fill: '#ef4444' },
    { name: 'Booked Deals', value: stats?.summary.booked_leads || 0, fill: '#22c55e' },
    { name: 'Lost Inquiries', value: stats?.summary.lost_leads || 0, fill: '#64748b' },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-surface-secondary rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-secondary rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-surface-secondary rounded-3xl" />
          <div className="h-80 bg-surface-secondary rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-text-primary">CRM Command Center</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              Real-Time
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Executive Pipeline, Conversion Funnel & Lead Health Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboardData} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-outline btn-sm gap-2"
          >
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export Leads'}
          </button>
          <button
            onClick={() => navigate('/admin/crm/leads/create')}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* 8 Executive Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.summary.total_leads ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="#6366f1"
          delta="Full active pipeline"
          positive={true}
          onClick={() => navigate('/admin/crm/leads')}
        />
        <StatCard
          title="Hot & VIP Leads"
          value={stats?.summary.hot_leads ?? 0}
          icon={<Flame className="w-5 h-5" />}
          color="#ef4444"
          delta="Immediate attention"
          positive={true}
          onClick={() => navigate('/admin/crm/leads?priority=hot')}
        />
        <StatCard
          title="New Today"
          value={stats?.summary.new_leads_today ?? 0}
          icon={<Plus className="w-5 h-5" />}
          color="#10b981"
          delta="Inbound registration"
          positive={true}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.summary.conversion_rate ?? 0}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#f59e0b"
          delta="Inquiries → Won Deals"
          positive={(stats?.summary.conversion_rate ?? 0) > 10}
        />
        <StatCard
          title="Booked Deals"
          value={stats?.summary.booked_leads ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="#22c55e"
          delta="Successfully closed"
          positive={true}
          onClick={() => navigate('/admin/bookings')}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(stats?.summary.estimated_pipeline_value ?? 0)}
          icon={<DollarSign className="w-5 h-5" />}
          color="#8b5cf6"
          delta="Estimated deal volume"
          positive={true}
        />
        <StatCard
          title="Lost Inquiries"
          value={stats?.summary.lost_leads ?? 0}
          icon={<AlertCircle className="w-5 h-5" />}
          color="#64748b"
          delta="Drop-off records"
          positive={false}
          onClick={() => navigate('/admin/crm/leads?stage=lost')}
        />
        <StatCard
          title="Pending Follow-ups"
          value={stats?.summary.pending_reminders ?? 0}
          icon={<Bell className="w-5 h-5" />}
          color="#f97316"
          delta="Scheduled activities"
          positive={false}
        />
      </div>

      {/* Main Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Pipeline Funnel (7 cols) */}
        <div className="lg:col-span-7 card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-text-primary">Pipeline Conversion Funnel</h3>
              <p className="text-xs text-text-secondary">Lead progression across sales stages</p>
            </div>
            <button onClick={() => navigate('/admin/crm/kanban')} className="btn btn-outline btn-xs gap-1.5">
              <Eye className="w-3 h-3" /> Kanban Board
            </button>
          </div>

          {funnelData.length > 0 ? (
            <div className="space-y-3 pt-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 110, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 500 }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`${v} Leads`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-text-muted space-y-2">
              <Layers className="w-8 h-8 opacity-40" />
              <p className="text-sm">No active pipeline stages recorded</p>
            </div>
          )}
        </div>

        {/* Lead Sources Distribution (5 cols) */}
        <div className="lg:col-span-5 card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-text-primary">Lead Source Attribution</h3>
              <p className="text-xs text-text-secondary">Channel performance breakdown</p>
            </div>
          </div>

          {sourceData.length > 0 ? (
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`${v} Leads`, 'Attribution']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 text-[11px] pt-1">
                {sourceData.map((src, i) => (
                  <div key={src.source} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                    <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="text-text-secondary">{src.source}:</span>
                    <strong className="text-text-primary">{src.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-text-muted space-y-2">
              <Users className="w-8 h-8 opacity-40" />
              <p className="text-sm">No source attribution data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Inbound Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Inbound Leads (8 cols) */}
        <div className="lg:col-span-8 card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-text-primary">Recent Inbound Leads</h3>
              <p className="text-xs text-text-secondary">Latest customer registrations and inquiries</p>
            </div>
            <button onClick={() => navigate('/admin/crm/leads')} className="btn btn-outline btn-xs gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">No recent leads found</div>
          ) : (
            <div className="space-y-2.5">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-secondary border border-border hover:border-primary/30 transition-all cursor-pointer group shadow-soft"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-navy flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {(lead.first_name?.[0] || 'L').toUpperCase()}{(lead.last_name?.[0] || '').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                        {lead.full_name || `${lead.first_name} ${lead.last_name || ''}`.trim()}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">
                        {lead.property_name ? `${lead.property_name} • ` : ''}{lead.email || lead.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary">
                      {lead.stage?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        lead.priority === 'hot' || lead.priority === 'vip'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                      }`}
                    >
                      {lead.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick SaaS Actions & CRM Shortcuts (4 cols) */}
        <div className="lg:col-span-4 card p-6 space-y-4">
          <h3 className="font-heading font-bold text-text-primary">CRM Operations</h3>
          <p className="text-xs text-text-secondary">Fast-track direct access</p>

          <div className="space-y-2.5">
            {[
              {
                label: 'Kanban Pipeline',
                desc: 'Visual drag-and-drop board',
                icon: <Target className="w-4 h-4 text-primary" />,
                path: '/admin/crm/kanban',
              },
              {
                label: 'All Leads Directory',
                desc: 'Filterable lead records & search',
                icon: <Users className="w-4 h-4 text-blue-500" />,
                path: '/admin/crm/leads',
              },
              {
                label: 'Customer 360 Profiles',
                desc: 'Complete customer transaction histories',
                icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
                path: '/admin/crm/customers',
              },
              {
                label: 'Site Visit Dispatch',
                desc: 'Inspection schedule & slots',
                icon: <Eye className="w-4 h-4 text-accent" />,
                path: '/admin/site-visits',
              },
              {
                label: 'Revenue & Commissions',
                desc: 'Automated sharing & wallet ledger',
                icon: <DollarSign className="w-4 h-4 text-amber-500" />,
                path: '/admin/revenue',
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-secondary border border-border hover:border-primary/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-text-muted">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
