import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Search, AlertCircle, RefreshCw, ChevronRight,
  X, CheckCircle, XCircle, Clock, Loader2, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react';
import {
  listWallets,
  getWalletByUser,
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  type WalletSummary,
  type WalletDetail,
  type WithdrawalRequest,
} from '../../../api/admin-revenue.api';

function formatINR(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

// ── Wallet Detail Drawer ──────────────────────────────────────────────────────

function WalletDrawer({
  wallet, onClose,
}: {
  wallet: WalletSummary | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<WalletDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet) { setDetail(null); return; }
    setLoading(true);
    getWalletByUser(wallet.user_id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [wallet]);

  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border-l border-border w-full max-w-md flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Wallet Details</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Available Balance', value: detail?.balance ?? wallet.balance, color: 'text-emerald-500' },
                { label: 'Escrow / Held', value: detail?.held_balance ?? wallet.held_balance, color: 'text-amber-500' },
                { label: 'Total Earned', value: detail?.total_earned ?? wallet.total_earned, color: 'text-text-primary' },
                { label: 'Total Withdrawn', value: detail?.total_withdrawn ?? wallet.total_withdrawn, color: 'text-text-secondary' },
              ].map((item) => (
                <div key={item.label} className="bg-surface-secondary/40 border border-border rounded-xl p-4">
                  <p className="text-xs text-text-secondary mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{formatINR(item.value)}</p>
                </div>
              ))}
            </div>

            {/* Transaction History */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3">Transaction History</h3>
              {(detail?.transactions || []).length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No transactions yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(detail?.transactions || []).slice(0, 20).map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3 p-3 bg-surface-secondary/40 border border-border rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        txn.transaction_type === 'credit'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {txn.transaction_type === 'credit'
                          ? <ArrowDownLeft className="w-4 h-4" />
                          : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{txn.description || txn.reference_type || 'Transaction'}</p>
                        <p className="text-[10px] text-text-muted">{new Date(txn.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <p className={`text-sm font-bold ${txn.transaction_type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Withdrawal Action Modal ────────────────────────────────────────────────────

function WithdrawalModal({
  wd, onClose, onAction,
}: {
  wd: WithdrawalRequest | null;
  onClose: () => void;
  onAction: (id: number, action: 'approve' | 'reject', notes: string, ref?: string) => Promise<void>;
}) {
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [ref, setRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (wd) { setNotes(''); setRef(''); setError(null); setAction('approve'); } }, [wd]);

  if (!wd) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onAction(wd.id, action, notes, ref);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Process Withdrawal #{wd.id}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</div>}

          <div className="bg-surface-secondary/40 border border-border rounded-xl p-4 space-y-1">
            <p className="text-xs text-text-secondary">Amount Requested</p>
            <p className="text-2xl font-bold text-emerald-500">₹{wd.amount.toLocaleString('en-IN')}</p>
            {wd.bank_name && <p className="text-xs text-text-secondary">{wd.bank_name} — {wd.account_number}</p>}
            {wd.upi_id && <p className="text-xs text-text-secondary">UPI: {wd.upi_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                action === 'approve'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-surface-secondary border-border text-text-secondary hover:border-emerald-600'
              }`}
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                action === 'reject'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-surface-secondary border-border text-text-secondary hover:border-red-600'
              }`}
            >
              ✕ Reject
            </button>
          </div>

          {action === 'approve' && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Transaction Reference</label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="UTR / NEFT / IMPS reference"
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              {action === 'reject' ? 'Rejection Reason *' : 'Admin Notes'}
            </label>
            <textarea
              rows={2}
              required={action === 'reject'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === 'reject' ? 'Reason for rejection...' : 'Optional notes...'}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-secondary hover:bg-surface-secondary/80 text-text-secondary text-sm font-medium rounded-xl transition">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition disabled:opacity-50 ${
                action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Processing…' : action === 'approve' ? 'Approve Payout' : 'Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WalletManagementPage() {
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'wallets' | 'withdrawals'>('wallets');
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null);
  const [selectedWd, setSelectedWd] = useState<WithdrawalRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wData, wdData] = await Promise.all([
        listWallets({ limit: 100 }),
        listWithdrawals({ limit: 100 }),
      ]);
      setWallets(wData);
      setWithdrawals(wdData);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdrawalAction = async (
    id: number, action: 'approve' | 'reject', notes: string, ref?: string
  ) => {
    const fn = action === 'approve' ? approveWithdrawal : rejectWithdrawal;
    const updated = await fn(id, {
      admin_notes: notes,
      rejection_reason: action === 'reject' ? notes : undefined,
      transaction_reference: ref,
    });
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? updated : w)));
  };

  const filteredWallets = wallets.filter((w) =>
    !search || w.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter((w) =>
    !search || w.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = withdrawals.filter((w) => w.status === 'pending' || w.status === 'under_review').length;

  return (
    <div className="space-y-6">
      <WalletDrawer wallet={selectedWallet} onClose={() => setSelectedWallet(null)} />
      <WithdrawalModal
        wd={selectedWd}
        onClose={() => setSelectedWd(null)}
        onAction={handleWithdrawalAction}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Partner Wallets &amp; Balances</h1>
          <p className="text-sm text-text-secondary mt-0.5">Monitor commission balances, escrow holdings &amp; withdrawal requests</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-secondary text-text-primary text-sm font-medium rounded-xl transition border border-border disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setTab('wallets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${tab === 'wallets' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}`}
        >
          Partner Wallets ({wallets.length})
        </button>
        <button
          onClick={() => setTab('withdrawals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${tab === 'withdrawals' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}`}
        >
          Withdrawal Requests
          {pendingCount > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={tab === 'wallets' ? 'Search by user ID...' : 'Search withdrawals...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Wallets Table */}
      {tab === 'wallets' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-border/60">
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-32 h-3 bg-surface-secondary rounded" />
                    <div className="w-20 h-3 bg-surface-secondary rounded" />
                  </div>
                  <div className="w-24 h-4 bg-surface-secondary rounded" />
                  <div className="w-20 h-4 bg-surface-secondary rounded" />
                </div>
              ))}
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No wallets found</p>
              <p className="text-xs mt-1">Wallets are created automatically when commissions are calculated</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface-secondary/50 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">User ID</th>
                  <th className="px-6 py-3.5">Available Balance</th>
                  <th className="px-6 py-3.5">Escrow / Held</th>
                  <th className="px-6 py-3.5">Total Earned</th>
                  <th className="px-6 py-3.5">Total Withdrawn</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-surface-secondary/40 transition">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                          W
                        </div>
                        <span className="font-mono text-xs">{w.user_id.slice(0, 12)}…</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-500">{formatINR(w.balance)}</td>
                    <td className="px-6 py-4 text-amber-500 font-medium">{formatINR(w.held_balance)}</td>
                    <td className="px-6 py-4 text-text-primary">{formatINR(w.total_earned)}</td>
                    <td className="px-6 py-4 text-text-secondary">{formatINR(w.total_withdrawn)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        w.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-text-secondary bg-surface-secondary'
                      }`}>
                        {w.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {w.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedWallet(w)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Withdrawals Table */}
      {tab === 'withdrawals' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No withdrawal requests</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface-secondary/50 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">User ID</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Payment Method</th>
                  <th className="px-6 py-3.5">Requested</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWithdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-surface-secondary/40 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-text-primary">#{wd.id}</td>
                    <td className="px-6 py-4 font-mono text-xs">{wd.user_id.slice(0, 12)}…</td>
                    <td className="px-6 py-4 font-bold text-emerald-500">₹{wd.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {wd.upi_id ? `UPI: ${wd.upi_id}` : wd.bank_name ? `${wd.bank_name}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {new Date(wd.requested_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        wd.status === 'processed' || wd.status === 'approved' ? 'text-emerald-500 bg-emerald-500/10' :
                        wd.status === 'pending' || wd.status === 'under_review' ? 'text-amber-500 bg-amber-500/10' :
                        'text-red-500 bg-red-500/10'
                      }`}>
                        {(wd.status === 'pending' || wd.status === 'under_review') && <Clock className="w-3.5 h-3.5" />}
                        {(wd.status === 'processed' || wd.status === 'approved') && <CheckCircle className="w-3.5 h-3.5" />}
                        {wd.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {wd.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(wd.status === 'pending' || wd.status === 'under_review') && (
                        <button
                          onClick={() => setSelectedWd(wd)}
                          className="px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-600 text-white rounded-lg transition"
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
