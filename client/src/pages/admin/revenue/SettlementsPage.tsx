import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle2, Clock, Play, AlertCircle, RefreshCw,
  X, Loader2, FileCheck, ArrowRight,
} from 'lucide-react';
import {
  listSettlements,
  createSettlement,
  approveSettlement,
  type MonthlySettlement,
} from '../../../api/admin-revenue.api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    draft: { label: 'Draft', cls: 'bg-slate-800 text-slate-400', icon: <Clock className="w-3.5 h-3.5" /> },
    pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
    approved: { label: 'Approved', cls: 'bg-blue-500/10 text-blue-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    processed: { label: 'Processed', cls: 'bg-emerald-500/10 text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function CreateSettlementModal({
  open, onClose, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (month: number, year: number, notes: string) => Promise<void>;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(month, year, notes);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to create settlement');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Run Monthly Settlement Batch</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600 dark:text-blue-300">
              This will aggregate all pending commission records and create a settlement batch for approval.
              Existing pending commissions will be included in the batch.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional batch notes..."
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-secondary hover:bg-surface-secondary/80 text-text-secondary text-sm font-medium rounded-xl transition">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition shadow-glow-primary disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Run Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<MonthlySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSettlements();
      setSettlements(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const handleCreate = async (month: number, year: number, notes: string) => {
    const created = await createSettlement({ settlement_month: month, settlement_year: year, notes });
    setSettlements((prev) => [created, ...prev]);
  };

  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      const updated = await approveSettlement(id);
      setSettlements((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to approve settlement');
    } finally {
      setApproving(null);
    }
  };

  const totalProcessed = settlements
    .filter((s) => s.status === 'processed' || s.status === 'approved')
    .reduce((sum, s) => sum + s.total_commissions, 0);

  return (
    <div className="space-y-6">
      <CreateSettlementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Monthly Settlements</h1>
          <p className="text-sm text-text-secondary mt-0.5">Batch approval and distribution of monthly commission payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettlements}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-secondary text-text-primary text-sm rounded-xl border border-border transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition shadow-glow-primary"
          >
            <Play className="w-4 h-4" />
            Run Monthly Settlement Batch
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={fetchSettlements} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Stats */}
      {settlements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total Settlements</p>
            <p className="text-2xl font-bold text-text-primary mt-2">{settlements.length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total Processed</p>
            <p className="text-2xl font-bold text-emerald-500 mt-2">
              ₹{(totalProcessed / 100000).toFixed(2)}L
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-500 mt-2">
              {settlements.filter((s) => s.status === 'pending' || s.status === 'draft').length}
            </p>
          </div>
        </div>
      )}

      {/* Settlements List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-secondary rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 bg-surface-secondary rounded" />
                  <div className="w-64 h-3 bg-surface-secondary rounded" />
                </div>
                <div className="w-24 h-8 bg-surface-secondary rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : settlements.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center text-text-muted">
          <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No settlements yet</p>
          <p className="text-xs mt-1">Run your first monthly settlement batch to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {settlements.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-soft hover:border-primary/40 transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    {MONTHS[s.settlement_month - 1]} {s.settlement_year} Settlement Batch
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Initiated {new Date(s.created_at).toLocaleDateString('en-IN')}
                    {' '}&bull;{' '}{s.num_records} commission line items
                  </p>
                  {s.notes && <p className="text-xs text-text-muted mt-1 italic">{s.notes}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-xs text-text-secondary block">Total Payout</span>
                  <span className="text-xl font-extrabold text-emerald-500 font-heading">
                    ₹{(s.total_commissions / 100000).toFixed(2)}L
                  </span>
                </div>

                <div>
                  <span className="text-xs text-text-secondary block mb-1">Status</span>
                  <StatusBadge status={s.status} />
                </div>

                {(s.status === 'pending' || s.status === 'draft') && (
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={approving === s.id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {approving === s.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <ArrowRight className="w-3.5 h-3.5" />}
                    {approving === s.id ? 'Approving…' : 'Approve Batch Payout'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
