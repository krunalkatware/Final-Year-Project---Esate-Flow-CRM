import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Search, CheckCircle2, Clock, XCircle, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../../api/axios';
import { toast } from '../../../contexts/ToastContext';

interface DocItem {
  id: number;
  uuid?: string;
  booking_id: number;
  booking_number: string;
  customer_name: string;
  property_name: string;
  document_type: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/bookings/documents/all');
      if (Array.isArray(res.data)) {
        setDocs(res.data);
      } else {
        setDocs([]);
      }
    } catch (err) {
      console.warn('Could not fetch documents:', err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleVerify = async (action: 'verified' | 'rejected' | 'resubmission_required') => {
    if (!selectedDoc) return;
    if ((action === 'rejected' || action === 'resubmission_required') && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection or resubmission request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.put(`/admin/bookings/documents/${selectedDoc.id}/verify`, {
        status: action,
        rejection_reason: rejectionReason,
        notes: rejectionReason || `Marked as ${action}`,
      });
      toast.success(`Document marked as ${action.replace('_', ' ')}!`);
      setSelectedDoc(null);
      setRejectionReason('');
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update document verification status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = docs.filter(d => {
    const matchesSearch =
      (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.booking_number || '').toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'verified') return matchesSearch && d.is_verified;
    if (statusFilter === 'pending') return matchesSearch && !d.is_verified;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Admin Document Verification Center</h1>
          <p className="text-sm text-text-secondary">Review, verify, and manage customer identity, tax, and booking agreement documents</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search title, customer, or booking #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All ({docs.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            Under Review ({docs.filter(d => !d.is_verified).length})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`btn btn-sm ${statusFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
          >
            Verified ({docs.filter(d => d.is_verified).length})
          </button>
        </div>
      </div>

      {/* Table / Empty State */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="py-16 text-center text-text-secondary animate-pulse">
            <Clock className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-50" />
            <p>Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center text-text-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-40" />
            <h3 className="text-base font-semibold text-text-primary">No documents uploaded yet</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              Customer identity proofs, booking receipts, and sale agreements will appear here for verification once uploaded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface-secondary/70 text-text-muted text-xs uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-6 py-3.5">Booking / Customer</th>
                  <th className="px-6 py-3.5">Property</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-secondary/40 transition">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-text-primary">{d.title}</p>
                          <p className="text-xs text-text-muted">{d.file_name} {d.file_size_bytes ? `• ${(d.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-text-primary">{d.customer_name}</p>
                      <p className="text-xs text-primary font-mono">{d.booking_number}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary">{d.property_name}</td>
                    <td className="px-6 py-4 text-xs text-text-muted capitalize">{(d.document_type || '').replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        d.is_verified ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {d.is_verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {d.is_verified ? 'VERIFIED' : 'UNDER REVIEW'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedDoc(d)}
                        className="btn btn-outline btn-xs gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-hover">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary/20 text-primary rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Review Customer Document</h3>
                  <p className="text-xs text-text-muted">{selectedDoc.booking_number} • {selectedDoc.customer_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-text-muted hover:text-text-primary text-lg">✕</button>
            </div>

            <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Document Title:</span>
                <span className="font-bold text-text-primary">{selectedDoc.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Category:</span>
                <span className="font-bold text-primary uppercase">{selectedDoc.document_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Property:</span>
                <span className="font-bold text-text-primary">{selectedDoc.property_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Current Status:</span>
                <span className={`font-bold ${selectedDoc.is_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedDoc.is_verified ? 'Verified' : 'Under Review'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">Rejection / Resubmission Reason (Required if Rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document image is blurry. Please upload a clear color PDF or image."
                className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-primary min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleVerify('verified')}
                className="btn btn-primary flex-1 gap-1.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Verify
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleVerify('rejected')}
                className="btn btn-outline flex-1 gap-1.5 text-xs text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/40"
              >
                <XCircle className="w-4 h-4" /> Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
