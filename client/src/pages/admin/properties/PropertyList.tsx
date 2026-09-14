import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiClient } from '../../../api/admin-auth.api';
import {
  Building,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Archive,
  Copy,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const PropertyList: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('property_type', typeFilter);

      const res = await adminApiClient.get(`/admin/properties?${params.toString()}`);
      if (res.data?.success) {
        setProperties(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Error fetching admin properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProperties();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
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
      await adminApiClient.post(`/admin/properties/bulk-${action}`, { ids: selectedIds });
      setSelectedIds([]);
      fetchProperties();
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await adminApiClient.get('/admin/properties/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'properties_export.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  const handleImportCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      await adminApiClient.post('/admin/properties/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportModalOpen(false);
      setImportFile(null);
      fetchProperties();
    } catch (err) {
      console.error('Import CSV failed:', err);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await adminApiClient.post(`/admin/properties/${id}/duplicate`, {});
      fetchProperties();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await adminApiClient.delete(`/admin/properties/${id}`);
      fetchProperties();
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
            Property Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, edit, audit, and manage full lifecycle of real estate listings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/admin/properties/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </div>

      {/* Search & Filters Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, locality, RERA number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="booked">Booked</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5 flex items-center justify-between animate-fade-in text-xs">
          <span className="font-semibold text-primary">
            {selectedIds.length} properties selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/50 hover:bg-emerald-900"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction('unpublish')}
              className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 font-semibold border border-amber-800/50 hover:bg-amber-900"
            >
              Unpublish
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700 hover:bg-slate-700"
            >
              Archive
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
                    checked={selectedIds.length === properties.length && properties.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-0"
                  />
                </th>
                <th className="p-3">Property</th>
                <th className="p-3">Type</th>
                <th className="p-3">Location</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Visibility</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading properties...</p>
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No properties match your active filter criteria.
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primary_image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=80'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[200px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{p.builder_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 capitalize">{p.property_type}</td>
                    <td className="p-3 text-slate-300">
                      <p className="truncate max-w-[120px]">{p.locality}</p>
                      <p className="text-[10px] text-slate-500">{p.city}</p>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      ₹{(p.price / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          p.status === 'available'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : p.status === 'booked'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <XCircle className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/properties/view/${p.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="View Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/properties/edit/${p.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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
          <span>Showing {properties.length} of {total} properties</span>
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

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-white">Bulk Import Properties CSV</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleImportCSVSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Upload a CSV file containing columns: Title, Price, Type, Bedrooms, Bathrooms, Area SqFt, Locality.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile}
                  className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  Upload & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
