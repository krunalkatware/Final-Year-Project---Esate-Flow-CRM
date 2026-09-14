import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, Filter, X, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, Star, TrendingUp, Users, Home
} from 'lucide-react';
import { adminCRMApi } from '../../../api/admin-crm.api';

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadCustomers(); }, [page, search, city]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminCRMApi.getCustomers({
        page, limit: 12, search: search || undefined, city: city || undefined,
      });
      setCustomers(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Customer Directory</h1>
          <p className="text-sm text-text-secondary mt-0.5">{total} registered customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 w-full"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by city..."
            value={city}
            onChange={e => { setCity(e.target.value); setPage(1); }}
            className="input w-full sm:w-40"
          />
          {(search || city) && (
            <button onClick={() => { setSearch(''); setCity(''); setPage(1); }} className="btn-outline btn-sm gap-1 flex-shrink-0">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-text-secondary opacity-30 mb-3" />
          <p className="text-text-secondary">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/admin/crm/customers/${c.id}`)}
              className="card p-5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {c.full_name?.[0] || c.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate group-hover:text-indigo-600 transition-colors">{c.full_name || 'Unknown'}</p>
                  {c.customer_number && <p className="text-xs text-text-secondary">{c.customer_number}</p>}
                </div>
                {c.is_premium && (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                )}
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary mb-3">
                {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</div>}
                {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /><span className="truncate">{c.email}</span></div>}
                {c.city && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{c.city}</div>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-xs font-semibold">
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{c.lead_count ?? c.total_leads ?? 0} leads</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Home className="w-3.5 h-3.5" />
                  <span>{c.booking_count ?? c.total_bookings ?? 0} booked</span>
                </div>
                {(c.total_spent > 0) && (
                  <span className="text-[11px] text-text-muted font-normal">
                    ₹{(c.total_spent / 100000).toFixed(1)}L spent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm p-1.5"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm p-1.5"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
