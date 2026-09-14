import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, BarChart3, TrendingUp, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getRevenueReports, exportCSV, type RevenueReports } from '../../../api/admin-revenue.api';

const ROLE_COLORS: Record<string, string> = {
  broker: '#6366F1',
  sales_executive: '#10B981',
  channel_partner: '#F59E0B',
  platform: '#EC4899',
  referral: '#14B8A6',
  sales_manager: '#8B5CF6',
  builder: '#F97316',
};

function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function RevenueReportsPage() {
  const [reports, setReports] = useState<RevenueReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRevenueReports(selectedYear);
      setReports(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load revenue reports');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleExportByRole = () => {
    if (!reports?.by_role?.length) return;
    exportCSV(
      reports.by_role.map((r) => ({ Role: r.role, 'Total Commission (₹)': r.total, 'Records': r.count })),
      `estateflow_commission_by_role_${selectedYear}.csv`
    );
  };

  const handleExportMonthly = () => {
    if (!reports?.monthly?.length) return;
    exportCSV(
      reports.monthly.map((r) => ({ Month: r.month, 'Total Commission (₹)': r.total, 'Records': r.count })),
      `estateflow_monthly_commissions_${selectedYear}.csv`
    );
  };

  const handleExportAll = () => {
    if (!reports) return;
    exportCSV(
      [
        ...reports.by_role.map((r) => ({ Category: 'By Role', Key: r.role, Total: r.total, Count: r.count })),
        ...reports.monthly.map((r) => ({ Category: 'Monthly', Key: r.month, Total: r.total, Count: r.count })),
        ...reports.by_status.map((r) => ({ Category: 'By Status', Key: r.status, Total: r.total, Count: r.count })),
      ],
      `estateflow_full_report_${selectedYear}.csv`
    );
  };

  const totalCommissions = reports?.by_role?.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Financial &amp; Revenue Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Detailed audit statements, commission breakdowns &amp; settlement exports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-surface border border-border text-xs text-text-primary rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-secondary text-text-primary rounded-xl border border-border transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportAll}
            disabled={loading || !reports}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition shadow-glow-primary disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export All CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={fetchReports} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Commissions', value: formatINR(totalCommissions), sub: `${reports?.by_role?.reduce((s, r) => s + r.count, 0) ?? 0} records`, color: 'text-emerald-500' },
          { label: 'Active Roles', value: `${reports?.by_role?.length ?? 0}`, sub: 'stakeholder types receiving payouts', color: 'text-indigo-500' },
          { label: 'Monthly Entries', value: `${reports?.monthly?.length ?? 0}`, sub: `months of data for ${selectedYear}`, color: 'text-amber-500' },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">{item.label}</p>
            {loading
              ? <div className="w-24 h-7 bg-surface-secondary rounded mt-2 animate-pulse" />
              : <p className={`text-2xl font-bold mt-2 ${item.color}`}>{item.value}</p>
            }
            <p className="text-xs text-text-muted mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Monthly Commission Volume — {selectedYear}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Total commission value processed per month</p>
          </div>
          <button
            onClick={handleExportMonthly}
            disabled={loading || !reports?.monthly?.length}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="w-full h-full bg-surface-secondary/40 rounded-xl animate-pulse" />
          ) : !reports?.monthly?.length ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No monthly data for {selectedYear}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="currentColor" className="text-text-secondary" tick={{ fontSize: 11 }} />
                <YAxis stroke="currentColor" className="text-text-secondary" tick={{ fontSize: 11 }} tickFormatter={(v) => formatINR(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface, #fff)', borderColor: 'var(--color-border, #e2e8f0)', borderRadius: '12px' }}
                  formatter={(val: any) => [formatINR(Number(val)), 'Commissions']}
                />
                <Bar dataKey="total" name="Commission" fill="#1F7A68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Grid: By Role + By Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission By Role */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Commissions by Role</h3>
            <button
              onClick={handleExportByRole}
              disabled={loading || !reports?.by_role?.length}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-surface-secondary rounded-xl" />)}
            </div>
          ) : !reports?.by_role?.length ? (
            <div className="py-12 text-center text-text-muted text-sm">No role data yet</div>
          ) : (
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface-secondary/50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Records</th>
                  <th className="px-5 py-3 text-right">Total Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.by_role.map((r) => (
                  <tr key={r.role} className="hover:bg-surface-secondary/40 transition">
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[r.role] || '#64748b' }}
                      />
                      <span className="capitalize font-medium text-text-primary">
                        {r.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-secondary">{r.count}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-500">{formatINR(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Commission By Status + Download Cards */}
        <div className="space-y-4">
          {/* Status Breakdown */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-bold text-text-primary">By Status</h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-surface-secondary rounded-xl" />)}
              </div>
            ) : !reports?.by_status?.length ? (
              <div className="py-8 text-center text-text-muted text-sm">No data yet</div>
            ) : (
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="bg-surface-secondary/50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Count</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.by_status.map((r) => (
                    <tr key={r.status} className="hover:bg-surface-secondary/40 transition">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          r.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' :
                          r.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-surface-secondary text-text-secondary'
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-text-secondary">{r.count}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-text-primary">{formatINR(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Download Report Cards */}
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                title: 'Monthly Commission Audit',
                desc: 'Line-item export of every commission calculated',
                icon: FileText,
                color: 'bg-indigo-500/10 text-indigo-500',
                onClick: handleExportMonthly,
              },
              {
                title: 'TDS Summary (194H)',
                desc: 'Broker payout TDS withholding summary',
                icon: BarChart3,
                color: 'bg-amber-500/10 text-amber-500',
                onClick: handleExportByRole,
              },
            ].map((card) => (
              <div key={card.title} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-soft hover:border-primary/40 transition">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{card.title}</p>
                  <p className="text-xs text-text-secondary truncate">{card.desc}</p>
                </div>
                <button
                  onClick={card.onClick}
                  disabled={loading || !reports}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-secondary text-text-primary text-xs font-semibold rounded-lg transition border border-border disabled:opacity-40 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
