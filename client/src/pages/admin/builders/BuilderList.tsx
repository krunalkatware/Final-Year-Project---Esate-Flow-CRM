import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiClient } from '../../../api/admin-auth.api';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
} from 'lucide-react';

export const BuilderList: React.FC = () => {
  const navigate = useNavigate();
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchBuilders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (verificationFilter) params.append('verification_status', verificationFilter);

      const res = await adminApiClient.get(`/admin/builders?${params.toString()}`);
      if (res.data?.success) {
        setBuilders(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Error fetching admin builders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, [page, statusFilter, verificationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBuilders();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === builders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(builders.map((b) => b.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    try {
      await adminApiClient.post(`/admin/builders/bulk-${action}`, { ids: selectedIds });
      setSelectedIds([]);
      fetchBuilders();
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await adminApiClient.get('/admin/builders/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'builders_export.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      await adminApiClient.patch(`/admin/builders/${id}/verify`, {});
      fetchBuilders();
    } catch (err) {
      console.error('Verify failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this builder profile?')) return;
    try {
      await adminApiClient.delete(`/admin/builders/${id}`);
      fetchBuilders();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            Builder Management CRM
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage real estate developers, projects, legal verification, and documents.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/admin/builders/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Onboard Builder
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search builder name, RERA number, email, phone, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={verificationFilter}
            onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Audit</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5 flex items-center justify-between animate-fade-in text-xs">
          <span className="font-semibold text-primary">
            {selectedIds.length} builders selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/50 hover:bg-emerald-900"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 font-semibold border border-amber-800/50 hover:bg-amber-900"
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 font-semibold border border-rose-800/50 hover:bg-rose-900"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Enterprise Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === builders.length && builders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-0"
                  />
                </th>
                <th className="p-3">Builder Company</th>
                <th className="p-3">Location & RERA</th>
                <th className="p-3">Projects</th>
                <th className="p-3">Properties</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading builders...</p>
                  </td>
                </tr>
              ) : builders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No builder developers found matching search criteria.
                  </td>
                </tr>
              ) : (
                builders.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.logo_url}
                          alt={b.company_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[180px]">{b.company_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{b.email || b.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <p>{b.city}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{b.rera_number}</p>
                    </td>
                    <td className="p-3 text-slate-300 font-semibold">{b.projects_count}</td>
                    <td className="p-3 text-slate-300 font-semibold">{b.properties_count}</td>
                    <td className="p-3">
                      {b.verification_status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : b.verification_status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/50">
                          <Clock className="w-3 h-3" /> Pending Audit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800/50">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          b.status === 'active'
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.verification_status !== 'verified' && (
                          <button
                            onClick={() => handleVerify(b.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-950 text-emerald-400"
                            title="Verify Builder"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/builders/view/${b.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/builders/edit/${b.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {builders.length} of {total} builders</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-white">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
