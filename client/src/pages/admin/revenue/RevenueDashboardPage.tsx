import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, AlertCircle, RefreshCw, ChevronRight,
  Activity, BarChart3, PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  getRevenueDashboard,
  listWithdrawals,
  type RevenueDashboardKPIs,
  type WithdrawalRequest,
} from '../../../api/admin-revenue.api';
import { CommissionFlowStepper } from '../../../components/revenue/CommissionFlowStepper';

const ROLE_COLORS: Record<string, string> = {
  broker: '#6366F1',
  sales_executive: '#10B981',
  channel_partner: '#F59E0B',
  platform: '#EC4899',
  referral: '#14B8A6',
  sales_manager: '#8B5CF6',
  builder: '#F97316',
};

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function StatCard({
  label, value, sub, icon: Icon, color, loading,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="card p-5 animate-pulse space-y-3">
        <div className="flex justify-between"><div className="w-8 h-8 bg-surface-secondary rounded-xl" /><div className="w-20 h-4 bg-surface-secondary rounded" /></div>
        <div className="w-28 h-7 bg-surface-secondary rounded mt-2" />
        <div className="w-40 h-3 bg-surface-secondary rounded" />
      </div>
    );
  }
  return (
    <div className="card p-5 shadow-soft border border-border transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-text-primary mt-3 font-heading">{value}</p>
      <p className="text-xs font-medium text-text-muted mt-2">{sub}</p>
    </div>
  );
}

export default function RevenueDashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<RevenueDashboardKPIs | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, wdData] = await Promise.all([
        getRevenueDashboard(),
        listWithdrawals({ withdrawal_status: 'pending', limit: 5 }).catch(() => []),
      ]);
      setKpis(kpiData);
      setWithdrawals(wdData);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build chart data from API
  const monthlyTrend = (kpis?.monthly_trend || []).map((r) => ({
    month: MONTH_LABELS[r.month?.slice(5) ?? ''] || r.month?.slice(5) || r.month,
    commission: r.total,
  }));

  const roleBreakdown = (kpis?.commission_by_role || []).map((r, i) => ({
    name: r.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: r.total,
    color: Object.values(ROLE_COLORS)[i % Object.values(ROLE_COLORS).length],
  }));

  const totalRoleValue = roleBreakdown.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Revenue &amp; Finance Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Live revenue sharing, commissions, wallets &amp; settlements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-secondary text-text-primary text-sm font-medium rounded-xl transition border border-border disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/revenue/rules')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition shadow-glow-primary"
          >
            Commission Rules
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Visual Commission Flow Pipeline Stepper */}
      <CommissionFlowStepper />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Booking Volume"
          value={kpis ? formatINR(kpis.total_revenue_inr) : '—'}
          sub="Gross value of all confirmed bookings"
          icon={DollarSign}
          color="bg-indigo-500/10 text-indigo-400"
          loading={loading}
        />
        <StatCard
          label="Commissions Paid"
          value={kpis ? formatINR(kpis.total_commissions_paid) : '—'}
          sub={`${kpis?.total_commission_records ?? '—'} commission records total`}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Pending Withdrawals"
          value={kpis ? formatINR(kpis.pending_withdrawals_amount) : '—'}
          sub={`${kpis?.pending_withdrawals_count ?? '—'} requests awaiting approval`}
          icon={Clock}
          color="bg-amber-500/10 text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Active Partner Wallets"
          value={kpis ? `${kpis.active_wallets} Wallets` : '—'}
          sub={`${kpis ? formatINR(kpis.pending_commissions) : '—'} pending commissions`}
          icon={Wallet}
          color="bg-purple-500/10 text-purple-400"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Commission Payout Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly commission amounts processed</p>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full bg-slate-800/40 rounded-xl animate-pulse" />
            ) : monthlyTrend.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No commission data yet</p>
                <p className="text-xs mt-1">Commission records will appear here once bookings are processed</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatINR(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Commissions']}
                  />
                  <Area type="monotone" dataKey="commission" name="Commission" stroke="#6366F1" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Commission Split Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Commission Split by Role
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across stakeholders</p>
          </div>
          <div className="h-48">
            {loading ? (
              <div className="w-full h-full bg-slate-800/40 rounded-xl animate-pulse" />
            ) : roleBreakdown.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm text-center">
                No role distribution data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                    {roleBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs pt-4 border-t border-slate-800 mt-auto">
            {roleBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium truncate">{item.name}</span>
                <span className="text-slate-400 font-bold ml-auto">
                  {totalRoleValue > 0 ? `${Math.round((item.value / totalRoleValue) * 100)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links + Pending Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Withdrawals */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Pending Withdrawal Requests</h3>
              <p className="text-xs text-text-secondary">Awaiting admin approval</p>
            </div>
            <button
              onClick={() => navigate('/admin/revenue/wallets')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-32 h-3 bg-surface-secondary rounded" />
                    <div className="w-20 h-3 bg-surface-secondary rounded" />
                  </div>
                  <div className="w-20 h-6 bg-surface-secondary rounded-full" />
                </div>
              ))
            ) : withdrawals.length === 0 ? (
              <div className="px-5 py-10 text-center text-text-muted">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending withdrawals</p>
              </div>
            ) : (
              withdrawals.map((wd) => (
                <div key={wd.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-secondary/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold">
                      #{wd.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">User {wd.user_id.slice(0, 8)}…</p>
                      <p className="text-xs text-text-secondary">{new Date(wd.requested_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">₹{wd.amount.toLocaleString('en-IN')}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-soft">
          <h3 className="text-base font-bold text-text-primary mb-4">Revenue Modules</h3>
          {[
            { label: 'Commission Rules', sub: 'Configure payout logic by role', path: '/admin/revenue/rules', color: 'bg-indigo-500/10 text-indigo-500' },
            { label: 'Partner Wallets', sub: 'View balances & approve withdrawals', path: '/admin/revenue/wallets', color: 'bg-emerald-500/10 text-emerald-500' },
            { label: 'Monthly Settlements', sub: 'Batch payout settlement runs', path: '/admin/revenue/settlements', color: 'bg-amber-500/10 text-amber-500' },
            { label: 'Financial Reports', sub: 'CSV exports, TDS, audit logs', path: '/admin/revenue/reports', color: 'bg-purple-500/10 text-purple-500' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 p-4 bg-surface-secondary/40 border border-border rounded-xl hover:border-primary/40 hover:bg-surface-secondary transition group text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition">{item.label}</p>
                <p className="text-xs text-text-secondary truncate">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
