import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, Download, Eye, CheckCircle, XCircle,
  Clock, DollarSign, MoreVertical, Trash2, RefreshCw, IndianRupee,
  ChevronLeft, ChevronRight, BookOpen, Building2
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:               { label: 'Draft',              cls: 'bg-slate-500/20 text-slate-300' },
  requested:           { label: 'Requested',          cls: 'bg-blue-500/20 text-blue-300' },
  pending_approval:    { label: 'Pending Approval',   cls: 'bg-amber-500/20 text-amber-300' },
  approved:            { label: 'Approved',           cls: 'bg-emerald-500/20 text-emerald-300' },
  agreement_generated: { label: 'Agreement Generated', cls: 'bg-violet-500/20 text-violet-300' },
  payment_pending:     { label: 'Payment Pending',    cls: 'bg-orange-500/20 text-orange-300' },
  token_paid:          { label: 'Token Paid',         cls: 'bg-cyan-500/20 text-cyan-300' },
  installment_running: { label: 'Installment Running', cls: 'bg-teal-500/20 text-teal-300' },
  completed:           { label: 'Completed',          cls: 'bg-green-500/20 text-green-300' },
  rejected:            { label: 'Rejected',           cls: 'bg-red-500/20 text-red-300' },
  cancelled:           { label: 'Cancelled',          cls: 'bg-rose-500/20 text-rose-300' },
  refund_initiated:    { label: 'Refund Initiated',   cls: 'bg-pink-500/20 text-pink-300' },
  refund_completed:    { label: 'Refund Completed',   cls: 'bg-purple-500/20 text-purple-300' },
  expired:             { label: 'Expired',            cls: 'bg-gray-500/20 text-gray-300' },
};

function formatINR(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

export default function BookingListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data, loading, refetch } = useQuery(
    () => adminBookingsApi.getBookings({ page, limit: 12, search, status: statusFilter || undefined }),
    [page, search, statusFilter]
  );

  const bookings = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkApprove = async () => {
    await adminBookingsApi.bulkApprove(selected);
    setSelected([]);
    refetch();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} bookings?`)) return;
    await adminBookingsApi.bulkDelete(selected);
    setSelected([]);
    refetch();
  };

  return (
    <div className="space-y-6 p-6" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Management</h1>
          <p className="text-slate-400 mt-1">{total} total bookings across all statuses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => adminBookingsApi.exportCSV()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all">
            <Download size={16} /> Export
          </button>
          <button onClick={() => navigate('/admin/bookings/new')}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by booking number, customer name, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_PILL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
          <span className="text-sm text-indigo-300">{selected.length} bookings selected</span>
          <button onClick={handleBulkApprove} className="px-3 py-1.5 text-sm rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle size={14} /> Bulk Approve
          </button>
          <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 flex items-center gap-1.5">
            <Trash2 size={14} /> Bulk Delete
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-slate-400 hover:text-white">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <BookOpen size={40} className="mb-3 opacity-50" />
            <p>No bookings found</p>
            {search && <p className="text-sm mt-1">Try clearing the search filter</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="p-4 text-left">
                    <input type="checkbox" onChange={e => setSelected(e.target.checked ? bookings.map((b: any) => b.id) : [])}
                      checked={selected.length === bookings.length && bookings.length > 0}
                      className="w-4 h-4 rounded" />
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Booking No.</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Property / Unit</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Net Total</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Paid</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {bookings.map((b: any) => {
                  const pill = STATUS_PILL[b.status] || { label: b.status, cls: 'bg-slate-500/20 text-slate-300' };
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                        <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleSelect(b.id)}
                          className="w-4 h-4 rounded" />
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold text-indigo-400">{b.booking_number}</span>
                      </td>
                      <td className="p-4">
                        {b.customer ? (
                          <div>
                            <div className="text-sm font-medium text-white">{b.customer.name}</div>
                            <div className="text-xs text-slate-400">{b.customer.phone}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No customer linked</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm text-white truncate max-w-36">{b.property?.title || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{b.bhk_type} · Unit {b.unit_number}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${pill.cls}`}>
                          {pill.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-white">{formatINR(b.net_total)}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm text-emerald-400">{formatINR(b.paid_amount)}</div>
                          <div className="text-xs text-slate-500">{formatINR(b.remaining_amount)} remaining</div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <button onClick={() => navigate(`/admin/bookings/${b.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Page {page} of {pages} · {total} total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} /> Prev
              </button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 transition-all">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
