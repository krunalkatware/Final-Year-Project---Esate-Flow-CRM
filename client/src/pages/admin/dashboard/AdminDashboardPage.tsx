import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../api/axios';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import {
  Building,
  CheckCircle2,
  Tag,
  HardHat,
  Users,
  CalendarCheck,
  DollarSign,
  MapPin,
  Star,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Clock,
  Plus,
  Zap,
  Activity,
  ArrowUpRight,
  LayoutDashboard,
} from 'lucide-react';
import { PersonalizedGreetingHeader } from '../../../components/dashboard/PersonalizedGreetingHeader';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricItem {
  value: number;
  formatted?: string;
  growth: number;
  period: string;
  sparkline: number[];
}

interface SummaryData {
  total_properties: MetricItem;
  active_listings: MetricItem;
  sold_properties: MetricItem;
  total_builders: MetricItem;
  total_customers: MetricItem;
  total_bookings: MetricItem;
  revenue: MetricItem;
  pending_site_visits: MetricItem;
  pending_reviews: MetricItem;
  pending_documents: MetricItem;
  wishlist_count: MetricItem;
}

interface ChartsData {
  property_growth: any[];
  monthly_bookings: any[];
  revenue_overview: any[];
  site_visit_trend: any[];
  customer_growth: any[];
  timeline: any[];
}

// Premium light-theme chart colors
const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  borderColor: '#E7E5E0',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#1E293B',
  boxShadow: '0 4px 16px rgba(22,50,79,0.10)',
};

const PIE_COLORS = ['#1F7A68', '#16324F', '#C6A15B', '#64748B'];

const cardConfig = [
  {
    key: 'total_properties',
    label: 'Total Properties',
    icon: Building,
    iconBg: '#EBF1F7',
    iconColor: '#16324F',
    accentColor: '#16324F',
    sparkColor: '#16324F',
  },
  {
    key: 'active_listings',
    label: 'Active Listings',
    icon: CheckCircle2,
    iconBg: '#DDEFE9',
    iconColor: '#1F7A68',
    accentColor: '#1F7A68',
    sparkColor: '#1F7A68',
  },
  {
    key: 'sold_properties',
    label: 'Sold Properties',
    icon: Tag,
    iconBg: '#F3E7D3',
    iconColor: '#C6A15B',
    accentColor: '#C6A15B',
    sparkColor: '#C6A15B',
  },
  {
    key: 'total_builders',
    label: 'Registered Builders',
    icon: HardHat,
    iconBg: '#FEF9C3',
    iconColor: '#92400E',
    accentColor: '#D69E2E',
    sparkColor: '#D69E2E',
  },
  {
    key: 'total_customers',
    label: 'Total Customers',
    icon: Users,
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    accentColor: '#1D4ED8',
    sparkColor: '#3B82F6',
  },
  {
    key: 'total_bookings',
    label: 'Total Bookings',
    icon: CalendarCheck,
    iconBg: '#DDEFE9',
    iconColor: '#1F7A68',
    accentColor: '#1F7A68',
    sparkColor: '#1F7A68',
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    icon: DollarSign,
    iconBg: '#F3E7D3',
    iconColor: '#C6A15B',
    accentColor: '#C6A15B',
    sparkColor: '#C6A15B',
    isCurrency: true,
  },
  {
    key: 'pending_site_visits',
    label: 'Pending Visits',
    icon: MapPin,
    iconBg: '#FEE2E2',
    iconColor: '#C05656',
    accentColor: '#C05656',
    sparkColor: '#C05656',
  },
  {
    key: 'pending_reviews',
    label: 'Pending Reviews',
    icon: Star,
    iconBg: '#FEF9C3',
    iconColor: '#D69E2E',
    accentColor: '#D69E2E',
    sparkColor: '#D69E2E',
  },
  {
    key: 'pending_documents',
    label: 'Pending Documents',
    icon: FileCheck,
    iconBg: '#F1EFE9',
    iconColor: '#64748B',
    accentColor: '#64748B',
    sparkColor: '#64748B',
  },
] as const;

export const AdminDashboardPage: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, chartsRes, bookingsRes, customersRes, visitsRes] = await Promise.all([
        apiClient.get('/admin/dashboard/summary').catch(() => null),
        apiClient.get('/admin/dashboard/charts').catch(() => null),
        apiClient.get('/admin/dashboard/recent-bookings?limit=5').catch(() => null),
        apiClient.get('/admin/dashboard/recent-customers?limit=5').catch(() => null),
        apiClient.get('/admin/dashboard/recent-site-visits?limit=5').catch(() => null),
      ]);
      if (summaryRes?.data?.metrics) setSummary(summaryRes.data.metrics);
      if (chartsRes?.data?.charts) setCharts(chartsRes.data.charts);
      if (bookingsRes?.data?.items) {
        setRecentBookings(bookingsRes.data.items);
        setBookingTotal(bookingsRes.data.total ?? bookingsRes.data.items.length);
      }
      if (customersRes?.data?.items) setRecentCustomers(customersRes.data.items);
      if (visitsRes?.data?.items) setRecentVisits(visitsRes.data.items);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const filteredBookings = recentBookings.filter(
    (b) =>
      !bookingSearch ||
      b.booking_number?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  // Premium shared card style
  const panelStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #E7E5E0',
    borderRadius: '1rem',
    boxShadow: '0 2px 8px rgba(22,50,79,0.05)',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <PersonalizedGreetingHeader
        userName={adminUser?.first_name || 'Admin'}
        userRole={adminUser?.admin_role_display || 'Super Admin'}
      />

      {/* ── Executive Command Launcher ───────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #16324F 0%, #1F4E6B 100%)',
          borderRadius: '1.25rem',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 20px rgba(22,50,79,0.18)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                padding: '0.625rem',
                background: 'rgba(31,122,104,0.25)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(31,122,104,0.35)',
                flexShrink: 0,
              }}
            >
              <Zap className="w-5 h-5" style={{ color: '#6EE7D5' }} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                Executive Command Launcher
                <span
                  className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(110,231,213,0.15)', color: '#6EE7D5', border: '1px solid rgba(110,231,213,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live System Online
                </span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Direct shortcuts to critical workflows — listings, site visits &amp; revenue
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/properties/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: '#1F7A68',
                color: 'white',
                boxShadow: '0 2px 8px rgba(31,122,104,0.35)',
              }}
            >
              <Plus className="w-3.5 h-3.5" /> New Property
            </Link>
            {[
              { to: '/admin/bookings/list', label: 'Review Bookings', icon: CalendarCheck },
              { to: '/admin/site-visits/list', label: 'VIP Site Visits', icon: MapPin },
              { to: '/admin/revenue/dashboard', label: 'Revenue Engine', icon: DollarSign },
              { to: '/admin/crm/leads', label: 'CRM Pipeline', icon: Users },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: '#DDEFE9', border: '1px solid #C2D9D3' }}
          >
            <LayoutDashboard className="w-5 h-5" style={{ color: '#1F7A68' }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold" style={{ color: '#16324F' }}>
              Enterprise Dashboard Overview
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
              Real-time analytics, market performance metrics, and pending activity logs.
            </p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'white',
            border: '1px solid #E7E5E0',
            color: '#475569',
            boxShadow: '0 1px 4px rgba(22,50,79,0.06)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F1EFE9';
            (e.currentTarget as HTMLButtonElement).style.color = '#1F7A68';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'white';
            (e.currentTarget as HTMLButtonElement).style.color = '#475569';
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: loading ? '#1F7A68' : 'currentColor' }} />
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {cardConfig.map((card) => {
          const Icon = card.icon;
          const data: MetricItem | undefined = summary?.[card.key as keyof SummaryData];
          const isPositive = (data?.growth ?? 0) >= 0;

          if (loading || !data) {
            return (
              <div
                key={card.key}
                style={{ ...panelStyle, padding: '1rem' }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl skeleton" />
                  <div className="w-12 h-4 rounded-full skeleton" />
                </div>
                <div className="w-20 h-7 rounded-lg skeleton" />
                <div className="w-24 h-3 rounded skeleton" />
              </div>
            );
          }

          return (
            <div
              key={card.key}
              style={{ ...panelStyle, padding: '1rem', cursor: 'default' }}
              className="transition-all duration-200 hover:-translate-y-0.5 group"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(22,50,79,0.09)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(22,50,79,0.05)';
              }}
            >
              {/* Icon + Growth Badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                </div>
                <div
                  className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: isPositive ? '#DCFCE7' : '#FEE2E2',
                    color: isPositive ? '#2F855A' : '#C05656',
                  }}
                >
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(data.growth)}%
                </div>
              </div>

              {/* Value */}
              <p className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: '#16324F' }}>
                {(card as any).isCurrency
                  ? data.formatted || `₹${(data.value / 10000000).toFixed(1)}Cr`
                  : data.value.toLocaleString()}
              </p>
              <p className="text-[11px] font-medium mt-1" style={{ color: '#64748B' }}>{card.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#BCBAB3' }}>{data.period}</p>

              {/* Mini Sparkline */}
              <div className="mt-3 h-7 flex items-end gap-0.5">
                {data.sparkline?.map((val, idx) => {
                  const max = Math.max(...data.sparkline, 1);
                  const pct = Math.max((val / max) * 100, 10);
                  const opacity = 0.2 + (idx / data.sparkline.length) * 0.8;
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${pct}%`,
                        background: card.sparkColor,
                        opacity,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart: Property Growth */}
        <div style={{ ...panelStyle, padding: '1.25rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Property Growth</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Monthly listings by category</p>
            </div>
            <span
              className="px-2.5 py-1 text-[10px] font-bold rounded-full"
              style={{ background: '#EBF1F7', color: '#16324F' }}
            >
              2026 YTD
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.property_growth || []}>
                <defs>
                  <linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16324F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16324F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F7A68" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1F7A68" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#D4D1CA" fontSize={10} />
                <YAxis stroke="#D4D1CA" fontSize={10} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="total" stroke="#16324F" strokeWidth={2} fillOpacity={1} fill="url(#gNavy)" />
                <Area type="monotone" dataKey="apartments" stroke="#1F7A68" strokeWidth={1.5} fillOpacity={1} fill="url(#gEmerald)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Bookings */}
        <div style={{ ...panelStyle, padding: '1.25rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Booking Volume</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Bookings vs Site Visits</p>
            </div>
            <span
              className="px-2.5 py-1 text-[10px] font-bold rounded-full"
              style={{ background: '#DDEFE9', color: '#1F7A68' }}
            >
              High Velocity
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthly_bookings || []} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#D4D1CA" fontSize={10} />
                <YAxis stroke="#D4D1CA" fontSize={10} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="bookings" fill="#1F7A68" radius={[4, 4, 0, 0]} />
                <Bar dataKey="site_visits" fill="#C6A15B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Revenue Distribution */}
        <div style={{ ...panelStyle, padding: '1.25rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Revenue Split</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>By property category</p>
            </div>
            <span
              className="px-2.5 py-1 text-[10px] font-bold rounded-full"
              style={{ background: '#F3E7D3', color: '#92400E' }}
            >
              ₹48.5 Cr
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts?.revenue_overview || []} cx="50%" cy="50%" innerRadius={44} outerRadius={65} paddingAngle={3} dataKey="value">
                  {(charts?.revenue_overview || []).map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {(charts?.revenue_overview || []).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[10px] truncate" style={{ color: '#64748B' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line Chart: Site Visit Trend */}
        <div style={{ ...panelStyle, padding: '1.25rem' }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Weekly Site Visit Execution</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Scheduled vs completed tours</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5" style={{ color: '#D69E2E' }}>
                <span className="w-3 h-0.5 bg-yellow-500 rounded inline-block" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5" style={{ color: '#1F7A68' }}>
                <span className="w-3 h-0.5 bg-emerald-600 rounded inline-block" /> Completed
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.site_visit_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="day" stroke="#D4D1CA" fontSize={10} />
                <YAxis stroke="#D4D1CA" fontSize={10} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="scheduled" stroke="#D69E2E" strokeWidth={2.5} dot={{ r: 3, fill: '#D69E2E' }} />
                <Line type="monotone" dataKey="completed" stroke="#1F7A68" strokeWidth={2.5} dot={{ r: 3, fill: '#1F7A68' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Log */}
        <div style={{ ...panelStyle, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex items-center justify-between" style={{ borderBottom: '1px solid #F1EFE9', paddingBottom: '0.75rem' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: '#1F7A68' }} />
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Activity Log</h3>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono font-semibold" style={{ color: '#1F7A68' }}>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 max-h-52 custom-scrollbar">
            {(charts?.timeline || []).map((item) => {
              const dotColors: Record<string, string> = {
                booking: '#1F7A68',
                site_visit: '#D69E2E',
                builder: '#16324F',
                property: '#C6A15B',
                review: '#D69E2E',
              };
              return (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: dotColors[item.type] || '#94A3B8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate" style={{ color: '#1E293B' }}>{item.title}</p>
                      <span className="text-[9px] shrink-0" style={{ color: '#94A3B8' }}>{item.time}</span>
                    </div>
                    <p className="text-[10px] leading-snug mt-0.5" style={{ color: '#64748B' }}>{item.description}</p>
                    <span
                      className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded"
                      style={{
                        background: item.badge === 'Confirmed' ? '#DCFCE7' : item.badge === 'Scheduled' ? '#FEF9C3' : '#F1EFE9',
                        color: item.badge === 'Confirmed' ? '#166534' : item.badge === 'Scheduled' ? '#713F12' : '#64748B',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Data Tables ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Bookings */}
        <div style={{ ...panelStyle, overflow: 'hidden' }}>
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: '1px solid #F1EFE9' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Recent Bookings</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Latest customer property reservations</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-32 pl-8 pr-2 py-1.5 rounded-lg text-[11px] transition-colors"
                  style={{
                    background: '#F7F6F2',
                    border: '1px solid #E7E5E0',
                    color: '#1E293B',
                  }}
                />
              </div>
              <Link
                to="/admin/bookings/list"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: '#F7F6F2', border: '1px solid #E7E5E0', color: '#475569' }}
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ background: '#FDFCFA', borderBottom: '1px solid #F1EFE9' }}>
                  {['Booking #', 'Customer', 'Property', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: '#94A3B8' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs" style={{ color: '#94A3B8' }}>
                      {loading ? 'Loading bookings...' : 'No bookings found'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #F7F6F2' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FDFCFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="p-3 font-mono font-bold text-[11px]" style={{ color: '#1F7A68' }}>
                        {b.booking_number}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold" style={{ color: '#1E293B' }}>{b.customer_name}</p>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>{b.customer_phone}</p>
                      </td>
                      <td className="p-3 truncate max-w-[130px]" style={{ color: '#475569' }}>{b.property_name}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                          style={{
                            background:
                              b.status === 'confirmed' ? '#DCFCE7' :
                              b.status === 'pending' || b.status === 'draft' ? '#FEF9C3' :
                              b.status === 'cancelled' ? '#FEE2E2' : '#F1EFE9',
                            color:
                              b.status === 'confirmed' ? '#166534' :
                              b.status === 'pending' || b.status === 'draft' ? '#713F12' :
                              b.status === 'cancelled' ? '#991B1B' : '#475569',
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/admin/bookings/${b.id}`}
                          className="p-1.5 rounded-lg inline-flex transition-colors"
                          style={{ color: '#D4D1CA' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#F1EFE9';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#1F7A68';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#D4D1CA';
                          }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-5 py-3 text-[11px]"
            style={{ borderTop: '1px solid #F1EFE9', color: '#94A3B8' }}
          >
            <span>Showing {filteredBookings.length} of {bookingTotal}</span>
            <div className="flex items-center gap-1.5">
              {[
                { onClick: () => setBookingPage((p) => Math.max(1, p - 1)), disabled: bookingPage === 1, icon: ChevronLeft },
                { onClick: () => setBookingPage((p) => p + 1), disabled: false, icon: ChevronRight },
              ].map(({ onClick, disabled, icon: Icon }, i) => (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={onClick}
                  className="p-1 rounded transition-colors disabled:opacity-40"
                  style={{ background: '#F7F6F2', border: '1px solid #E7E5E0' }}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
              <span className="px-2 font-semibold" style={{ color: '#16324F' }}>{bookingPage}</span>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div style={{ ...panelStyle, overflow: 'hidden' }}>
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: '1px solid #F1EFE9' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#16324F' }}>Latest Customers</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Newly onboarded buyers &amp; tenants</p>
            </div>
            <Link
              to="/admin/customers"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{ background: '#F7F6F2', border: '1px solid #E7E5E0', color: '#475569' }}
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ background: '#FDFCFA', borderBottom: '1px solid #F1EFE9' }}>
                  {['Customer', 'City', 'Preference', ''].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: '#94A3B8' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs" style={{ color: '#94A3B8' }}>
                      {loading ? 'Loading customers...' : 'No customers found'}
                    </td>
                  </tr>
                ) : (
                  recentCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #F7F6F2' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FDFCFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #1F7A68, #16324F)' }}
                          >
                            {(c.name || c.full_name || '?')[0]}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: '#1E293B' }}>{c.name || c.full_name}</p>
                            <p className="text-[10px]" style={{ color: '#94A3B8' }}>{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3" style={{ color: '#475569' }}>{c.city || '—'}</td>
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 text-[10px] rounded-full capitalize"
                          style={{ background: '#F1EFE9', color: '#64748B', border: '1px solid #E7E5E0' }}
                        >
                          {c.preferred_property_type || 'Any'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="p-1.5 rounded-lg inline-flex transition-colors"
                          style={{ color: '#D4D1CA' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#F1EFE9';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#1F7A68';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#D4D1CA';
                          }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Upcoming Site Visits */}
          {recentVisits.length > 0 && (
            <div
              className="p-4 space-y-3"
              style={{ borderTop: '1px solid #F1EFE9' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#16324F' }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: '#D69E2E' }} />
                  Upcoming Site Visits
                </span>
                <Link
                  to="/admin/site-visits/list"
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#1F7A68')}
                  onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = '#94A3B8')}
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {recentVisits.slice(0, 3).map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2.5 rounded-xl text-[11px]"
                    style={{ background: '#F7F6F2', border: '1px solid #E7E5E0' }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: '#1E293B' }}>{v.customer_name || 'Customer'}</p>
                      <p style={{ color: '#94A3B8' }}>{v.property_name}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                      style={{ background: '#FEF9C3', color: '#713F12' }}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
