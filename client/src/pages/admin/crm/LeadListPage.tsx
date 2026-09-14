import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, Filter, Eye, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Phone, Mail, MapPin,
  Flame, Star, ArrowUpDown, CheckSquare, Square, X, MessageSquare
} from 'lucide-react';
import { adminCRMApi, LeadItem } from '../../../api/admin-crm.api';
import LeadFormModal from './LeadFormModal';

const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  site_visit_scheduled: 'Site Visit', negotiation: 'Negotiation',
  booking_requested: 'Booking Req.', booked: 'Booked', lost: 'Lost', closed: 'Closed',
};

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20',
  contacted: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20',
  interested: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20',
  site_visit_scheduled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  negotiation: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  booking_requested: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/20',
  booked: 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/20',
  lost: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20',
  closed: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20',
};

const PRIORITY_BADGES: Record<string, string> = {
  vip: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
  hot: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
  low: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30',
};

export default function LeadListPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('');
  const [city, setCity] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeads();
  }, [page, search, stage, priority, city]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await adminCRMApi.getLeads({
        page,
        limit: 15,
        search: search || undefined,
        stage: stage || undefined,
        priority: priority || undefined,
        city: city || undefined,
      });
      setLeads(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this lead?')) return;
    await adminCRMApi.deleteLead(id);
    loadLeads();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected leads?`)) return;
    await Promise.all(selected.map(id => adminCRMApi.deleteLead(id)));
    setSelected([]);
    loadLeads();
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === leads.length) setSelected([]);
    else setSelected(leads.map(l => l.id));
  };

  const formatBudget = (v?: number) => {
    if (!v) return '—';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    return `₹${v.toLocaleString()}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">CRM Lead Management</h1>
          <p className="text-sm text-text-secondary mt-0.5">{total} leads in pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => adminCRMApi.exportCSV()} className="btn-outline btn-sm gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name, email, phone, lead number..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 w-full"
            />
          </div>
          <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }} className="input w-full sm:w-40">
            <option value="">All Stages</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="input w-full sm:w-36">
            <option value="">All Priority</option>
            <option value="vip">VIP</option>
            <option value="hot">Hot</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            type="text"
            placeholder="City..."
            value={city}
            onChange={e => { setCity(e.target.value); setPage(1); }}
            className="input w-full sm:w-32"
          />
          {(search || stage || priority || city) && (
            <button
              onClick={() => { setSearch(''); setStage(''); setPriority(''); setCity(''); setPage(1); }}
              className="btn-outline btn-sm gap-1 flex-shrink-0"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="card p-3 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 flex items-center gap-4">
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{selected.length} selected</span>
          <button onClick={handleBulkDelete} className="btn-sm bg-red-500 text-white hover:bg-red-600 gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete All
          </button>
          <button onClick={() => setSelected([])} className="btn-outline btn-sm">Deselect</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="p-3 w-10">
                  <button onClick={toggleAll}>
                    {selected.length === leads.length && leads.length > 0
                      ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                      : <Square className="w-4 h-4 text-text-secondary" />}
                  </button>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Lead</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Contact</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Stage</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Priority</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Budget</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">City</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Assigned</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Score</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(10)].map((_, j) => (
                    <td key={j} className="p-3"><div className="h-4 bg-border rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No leads found</p>
                      <button onClick={() => setShowForm(true)} className="btn-primary btn-sm gap-2">
                        <Plus className="w-4 h-4" /> Add First Lead
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && leads.map(lead => (
                <tr key={lead.id} className={`hover:bg-surface/50 transition-colors ${selected.includes(lead.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                  <td className="p-3">
                    <button onClick={() => toggleSelect(lead.id)}>
                      {selected.includes(lead.id)
                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                        : <Square className="w-4 h-4 text-text-secondary" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {lead.first_name[0]}{lead.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{lead.full_name}</p>
                        <p className="text-xs text-text-secondary">{lead.lead_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-text-primary">{lead.phone}</p>
                      {lead.email && <p className="text-xs text-text-secondary truncate max-w-[140px]">{lead.email}</p>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STAGE_COLORS[lead.stage] || 'bg-gray-100 text-gray-600'}`}>
                      {STAGE_LABELS[lead.stage] || lead.stage}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGES[lead.priority] || 'bg-gray-400 text-white'}`}>
                      {lead.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm font-semibold text-text-primary">{formatBudget(lead.budget_max)}</span>
                  </td>
                  <td className="p-3 text-xs text-text-secondary">{lead.city || '—'}</td>
                  <td className="p-3 text-xs text-text-secondary truncate max-w-[100px]">{lead.assigned_agent_name || 'Unassigned'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          style={{ width: `${lead.lead_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">{lead.lead_score}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.first_name}, connecting with you from EstateFlow regarding your property inquiry.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="WhatsApp Prospect"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded-lg hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Call Prospect"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="View Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/30">
            <span className="text-xs text-text-secondary">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm p-1.5">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold">{page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm p-1.5">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <LeadFormModal onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); loadLeads(); }} />
      )}
    </div>
  );
}
