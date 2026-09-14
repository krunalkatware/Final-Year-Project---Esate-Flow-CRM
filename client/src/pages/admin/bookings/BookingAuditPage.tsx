import React, { useState } from 'react';
import { Clock, User, Hash, ChevronLeft, ChevronRight, RefreshCw, Filter, Search } from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

export default function BookingAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, loading, refetch } = useQuery(
    () => adminBookingsApi.getAuditLogs({ page, limit: 20, search }),
    [page, search]
  );

  const logs = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const ACTION_COLOR: Record<string, string> = {
    CREATE: 'text-emerald-400 bg-emerald-500/10',
    UPDATE: 'text-blue-400 bg-blue-500/10',
    DELETE: 'text-red-400 bg-red-500/10',
    STATUS_CHANGE: 'text-violet-400 bg-violet-500/10',
    PAYMENT: 'text-cyan-400 bg-cyan-500/10',
    DOCUMENT: 'text-amber-400 bg-amber-500/10',
    COMMENT: 'text-indigo-400 bg-indigo-500/10',
  };

  return (
    <div className="p-6 space-y-6" style={{ minHeight: '100vh' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">Complete trail of all booking actions · {total} total events</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search audit events..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Clock size={32} className="mb-3 opacity-40" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {logs.map((log: any) => {
              const actionStyle = ACTION_COLOR[log.action] || 'text-slate-400 bg-slate-500/10';
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-mono font-bold mt-0.5 ${actionStyle}`}>
                    {log.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white truncate">{log.description || `Booking #${log.booking_id}`}</span>
                    </div>
                    {log.changes && (
                      <div className="text-xs text-slate-500 font-mono truncate">{JSON.stringify(log.changes).slice(0, 120)}</div>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User size={10} /> {log.performed_by_name || 'System'}</span>
                      <span className="flex items-center gap-1"><Hash size={10} /> Booking #{log.booking_id}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Page {page} of {pages} · {total} events</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-indigo-500 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} /> Prev
              </button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-indigo-500 disabled:opacity-40 transition-all">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
