import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Star, Calendar,
  TrendingUp, Home, Eye, DollarSign, Clock, User,
  CheckCircle2, AlertCircle, Sparkles, Building2,
  Heart, MessageSquare, ChevronRight, ShieldCheck,
  RefreshCw, Briefcase, FileText, Check, X,
  Download, ExternalLink, ShieldAlert, Plus, Layers,
  CreditCard, Loader2, FileCheck2, AlertTriangle,
} from 'lucide-react';
import { adminCRMApi } from '../../../api/admin-crm.api';
import { toast } from '../../../contexts/ToastContext';

/** Append the stored JWT token as ?token= so the backend can
 *  authenticate browser-tab file requests (where Auth headers aren't sent). */
function buildAuthedFileUrl(fileUrl: string): string {
  if (!fileUrl) return fileUrl;
  // Keys must match what axios.ts interceptor reads (in priority order)
  const token =
    localStorage.getItem('admin_access_token') ||
    localStorage.getItem('estateflow_admin_access_token') ||
    localStorage.getItem('access_token') || '';
  if (!token) return fileUrl;
  const sep = fileUrl.includes('?') ? '&' : '?';
  return `${fileUrl}${sep}token=${encodeURIComponent(token)}`;
}

type TabKey = 'overview' | 'bookings' | 'visits' | 'documents' | 'payments';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modal States
  const [rejectModalDoc, setRejectModalDoc] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);

  // Schedule Visit Modal
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [schedulePropId, setSchedulePropId] = useState<number>(1);
  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [scheduleTime, setScheduleTime] = useState<string>('11:00 AM - 01:00 PM');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const res = await adminCRMApi.getCustomer360(id!);
      setData(res);
    } catch (e: any) {
      console.error('Failed to load Customer 360 data', e);
      toast.error('Failed to load customer profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoc = async (docId: number, title: string) => {
    if (!id) return;
    setIsProcessingDoc(true);
    try {
      await adminCRMApi.verifyCustomerDoc(id, docId, 'Verified by Compliance Team');
      toast.success(`KYC Document '${title}' marked as Verified.`);
      await loadCustomer();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to verify document.');
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleRejectDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rejectModalDoc || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setIsProcessingDoc(true);
    try {
      await adminCRMApi.rejectCustomerDoc(id, rejectModalDoc.id, rejectionReason.trim());
      toast.success(`KYC Document '${rejectModalDoc.title}' rejected. Customer notified.`);
      setRejectModalDoc(null);
      setRejectionReason('');
      await loadCustomer();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reject document.');
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleScheduleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsScheduling(true);
    try {
      await adminCRMApi.scheduleCustomerVisit(id, {
        property_id: Number(schedulePropId),
        scheduled_date: new Date(scheduleDate).toISOString(),
        scheduled_time: scheduleTime,
        notes: scheduleNotes,
      });
      toast.success('Site visit scheduled successfully for this customer.');
      setShowScheduleModal(false);
      setScheduleNotes('');
      await loadCustomer();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to schedule site visit.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUpdateVisitStatus = async (visitId: number, status: string) => {
    if (!id) return;
    try {
      await adminCRMApi.updateCustomerVisitStatus(id, visitId, { status });
      toast.success(`Site visit status updated to ${status}.`);
      await loadCustomer();
    } catch (err: any) {
      toast.error('Failed to update visit status.');
    }
  };

  const formatCurrency = (v?: number) => {
    if (!v || v <= 0) return '—';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return '—';
    try {
      const dt = new Date(dStr);
      return dt.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dStr;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-surface-secondary rounded-xl w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-surface-secondary rounded-3xl" />
          <div className="lg:col-span-2 h-96 bg-surface-secondary rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-text-muted">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Customer Not Found</h2>
        <p className="text-sm text-text-secondary">The requested customer record does not exist or has been removed.</p>
        <button onClick={() => navigate('/admin/crm/customers')} className="btn btn-primary btn-sm gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>
      </div>
    );
  }

  const {
    profile,
    stats,
    bookings = [],
    site_visits = [],
    documents = [],
    payments = [],
    leads = [],
    wishlists = [],
    timeline = [],
  } = data;

  const currentLead = leads[0] || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/crm/customers')}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-all shadow-sm"
            title="Back to Customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Customer 360 Command Center
              </span>
              <span className="text-xs text-text-muted font-mono">ID: {profile.id.slice(0, 13)}...</span>
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-text-primary mt-0.5 flex items-center gap-2">
              {profile.full_name}
              {profile.is_verified ? (
                <span title="Verified Customer">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </span>
              ) : (
                <span className="badge badge-warning text-[10px]">Unverified</span>
              )}

            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadCustomer}
            className="btn btn-outline btn-sm gap-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh 360
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn btn-primary btn-sm gap-1.5 text-xs shadow-soft"
          >
            <Plus className="w-4 h-4" /> Schedule Site Visit
          </button>
        </div>
      </div>

      {/* Customer Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-surface to-surface-secondary border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile.full_name?.charAt(0)?.toUpperCase() || 'C'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">{profile.full_name}</h2>
              <span className="text-xs font-semibold text-text-muted">Registered {formatDate(profile.created_at)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mt-1.5">
              {profile.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-muted" /> {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-text-muted" /> {profile.phone}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" /> {profile.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right px-3 py-1.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Total Spent</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.total_spent)}
            </span>
          </div>
          <div className="text-right px-3 py-1.5 rounded-xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">KYC Verified</span>
            <span className={`text-sm font-extrabold ${stats.verified_document_count > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {stats.verified_document_count}/{stats.document_count} Docs
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        {[
          { key: 'overview', label: '360 Overview & Activity', count: null },
          { key: 'bookings', label: 'Bookings', count: bookings.length },
          { key: 'visits', label: 'Site Visits', count: site_visits.length },
          { key: 'documents', label: 'KYC Documents', count: documents.length },
          { key: 'payments', label: 'Payments & Ledger', count: payments.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary text-text-muted border border-border'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: 360 OVERVIEW & ACTIVITY STREAM ──────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Contact & Buying Preferences (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-heading font-bold text-text-primary flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Profile & Requirements
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Full Name</span>
                  <span className="font-semibold text-text-primary">{profile.full_name}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Official Email</span>
                  <span className="font-semibold text-text-primary truncate max-w-[180px]">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Contact Phone</span>
                  <span className="font-semibold text-text-primary">{profile.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Target Budget</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.budget_max > 0 ? `${formatCurrency(profile.budget_min)} – ${formatCurrency(profile.budget_max)}` : 'Flexible'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-text-secondary">Preferred Type</span>
                  <span className="font-semibold text-text-primary capitalize">{profile.preferred_property_type || 'Residential'}</span>
                </div>
                {profile.address && (
                  <div className="py-1.5 border-b border-border/60">
                    <span className="text-text-secondary block mb-0.5">Address</span>
                    <span className="font-medium text-text-primary">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active CRM Lead Card */}
            {currentLead && (
              <div className="card p-5 space-y-3 border-l-4 border-l-primary shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Active CRM Lead</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {currentLead.stage?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Lead Reference: <strong className="text-text-primary font-mono">{currentLead.lead_number}</strong>
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-text-muted">Lead Score:</span>
                  <span className="font-bold text-emerald-600">{currentLead.lead_score ?? 75}/100</span>
                </div>
                <button
                  onClick={() => navigate(`/admin/crm/leads/${currentLead.id}`)}
                  className="w-full mt-2 btn btn-outline btn-xs gap-1.5 text-primary justify-center"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> View in CRM Pipeline
                </button>
              </div>
            )}
          </div>

          {/* CENTER: Chronological Activity Timeline (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-heading font-bold text-text-primary">Customer 360 Activity Stream</h3>
                  <p className="text-xs text-text-secondary">Chronological audit events from database</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-secondary">
                  {timeline.length} Events
                </span>
              </div>

              {timeline.length === 0 ? (
                <div className="py-12 text-center text-text-muted space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm font-medium">No recorded events yet</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {timeline.map((evt: any) => (
                    <div key={evt.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="bg-surface rounded-2xl p-3.5 border border-border hover:border-primary/40 transition-all shadow-soft space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-text-primary">{evt.title}</span>
                          <span className="text-[10px] text-text-muted font-mono">{formatDate(evt.timestamp)}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Real Metrics & Stats (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-5 space-y-4 shadow-soft">
              <h3 className="text-sm font-heading font-bold text-text-primary flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Summary
              </h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                    Total Contract Value
                  </span>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(stats.total_spent)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-text-secondary block mb-0.5">Bookings</span>
                    <p className="text-lg font-bold text-text-primary">{stats.booking_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-text-secondary block mb-0.5">Site Visits</span>
                    <p className="text-lg font-bold text-text-primary">{stats.site_visit_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-text-secondary block mb-0.5">KYC Verified</span>
                    <p className="text-lg font-bold text-emerald-600">{stats.verified_document_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-text-secondary block mb-0.5">Payments</span>
                    <p className="text-lg font-bold text-text-primary">{stats.payment_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BOOKINGS ────────────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Customer Bookings ({bookings.length})</h3>
              <p className="text-xs text-text-secondary">Official property allotments and contract records</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <Building2 className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-medium">No bookings placed by this customer yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-secondary text-text-secondary uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Booking #</th>
                    <th className="p-3">Property Unit</th>
                    <th className="p-3">Agreement Value</th>
                    <th className="p-3">Token Paid</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-surface-secondary/40 transition">
                      <td className="p-3 font-mono font-bold text-primary">#{b.booking_number}</td>
                      <td className="p-3">
                        <p className="font-bold text-text-primary">{b.property_name || 'Unit'}</p>
                        <p className="text-[11px] text-text-muted">{b.property_locality}, {b.property_city}</p>
                      </td>
                      <td className="p-3 font-bold text-text-primary">{formatCurrency(b.agreed_price)}</td>
                      <td className="p-3 font-bold text-emerald-600">{formatCurrency(b.booking_amount)}</td>
                      <td className="p-3 text-text-muted">{formatDate(b.booking_date)}</td>
                      <td className="p-3">
                        <span className="badge badge-success uppercase text-[10px] font-bold">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => navigate(`/admin/bookings/${b.id}`)}
                          className="btn btn-outline btn-xs gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Booking
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SITE VISITS ─────────────────────────────────────────────── */}
      {activeTab === 'visits' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Site Visits ({site_visits.length})</h3>
              <p className="text-xs text-text-secondary">Inspection appointments and property tours</p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn btn-primary btn-sm gap-1.5 text-xs shadow-soft"
            >
              <Plus className="w-4 h-4" /> Schedule Visit
            </button>
          </div>

          {site_visits.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <Calendar className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-medium">No site visits scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {site_visits.map((v: any) => (
                <div key={v.id} className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">{v.visit_number}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {v.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">{v.property_name || 'Property'}</h4>
                    <p className="text-xs text-text-secondary">{v.property_locality}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(v.visit_date)}</span>
                    <span>{v.time_slot}</span>
                  </div>
                  {v.notes && (
                    <p className="text-[11px] text-text-secondary bg-surface-secondary p-2 rounded-lg">
                      Note: {v.notes}
                    </p>
                  )}
                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                    <button
                      onClick={() => handleUpdateVisitStatus(v.id, 'confirmed')}
                      className="btn btn-outline btn-xs text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleUpdateVisitStatus(v.id, 'completed')}
                      className="btn btn-outline btn-xs text-blue-600 border-blue-500/40 hover:bg-blue-500/10"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateVisitStatus(v.id, 'cancelled')}
                      className="btn btn-outline btn-xs text-red-500 border-red-500/40 hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: KYC DOCUMENTS ───────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">KYC Document Review Center</h3>
              <p className="text-xs text-text-secondary">Government-mandated identity, PAN, and address documentation</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {stats.verified_document_count} / {documents.length} Verified
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-medium">No KYC documents uploaded by this customer yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => {
                const isVerified = doc.status === 'verified' || doc.is_verified;
                const isRejected = doc.status === 'rejected';
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isVerified
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : isRejected
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-bold text-xs text-text-primary">{doc.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                            : isRejected
                            ? 'bg-red-500/20 text-red-500 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                        }`}
                      >
                        {doc.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-text-secondary bg-surface-secondary/60 p-2.5 rounded-xl border border-border/50">
                      <div className="flex justify-between">
                        <span>File Name:</span>
                        <span className="font-mono text-text-primary truncate max-w-[180px]">{doc.file_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Booking Ref:</span>
                        <span className="font-bold text-text-primary">#{doc.booking_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                      {doc.verified_by && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Verified By:</span>
                          <span className="font-semibold">{doc.verified_by}</span>
                        </div>
                      )}
                      {doc.rejection_reason && (
                        <div className="pt-1 text-red-500 border-t border-red-500/20">
                          <span className="font-bold block">Rejection Reason:</span>
                          <span>{doc.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-1.5">
                        {doc.file_url && (
                          <button
                            type="button"
                            onClick={() => window.open(buildAuthedFileUrl(doc.file_url), '_blank', 'noopener,noreferrer')}
                            className="btn btn-outline btn-xs gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Preview
                          </button>
                        )}
                        {doc.file_url && (
                          <a
                            href={buildAuthedFileUrl(doc.file_url)}
                            download={doc.file_name}
                            className="btn btn-ghost btn-xs gap-1 text-text-muted hover:text-text-primary"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Verify / Reject Actions */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        {!isVerified && (
                          <button
                            type="button"
                            disabled={isProcessingDoc}
                            onClick={() => handleVerifyDoc(doc.id, doc.title)}
                            className="btn btn-primary btn-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            <Check className="w-3 h-3" /> Verify
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            type="button"
                            disabled={isProcessingDoc}
                            onClick={() => {
                              setRejectModalDoc(doc);
                              setRejectionReason('');
                            }}
                            className="btn btn-outline btn-xs text-red-500 border-red-500/40 hover:bg-red-500/10 font-bold"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: PAYMENTS & LEDGER ───────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Payment Transactions ({payments.length})</h3>
              <p className="text-xs text-text-secondary">Token deposits and verified payment gateway receipts</p>
            </div>
            <span className="text-sm font-extrabold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
              Total Paid: {formatCurrency(stats.total_token_paid)}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <CreditCard className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-medium">No payments received from this customer yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-secondary text-text-secondary uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Booking #</th>
                    <th className="p-3">Property Unit</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Transaction Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-surface-secondary/40 transition">
                      <td className="p-3 font-mono font-bold text-text-primary">{p.payment_number}</td>
                      <td className="p-3 font-mono text-primary font-semibold">#{p.booking_number || 'N/A'}</td>
                      <td className="p-3 font-medium text-text-primary">{p.property_name || 'Reserved Property'}</td>
                      <td className="p-3 font-bold text-emerald-600 text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="p-3 uppercase font-semibold text-text-secondary">{p.payment_mode}</td>
                      <td className="p-3 font-mono text-[11px] text-text-muted truncate max-w-[150px]">{p.transaction_reference || '—'}</td>
                      <td className="p-3 text-text-muted">{formatDate(p.payment_date)}</td>
                      <td className="p-3">
                        <span className="badge badge-success uppercase text-[10px] font-bold">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: DOCUMENT REJECTION WITH MANDATORY REASON ────────────────── */}
      {rejectModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form onSubmit={handleRejectDocSubmit} className="bg-card border border-border w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-text-primary">Reject KYC Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Please provide a clear reason for rejecting <strong className="text-text-primary">{rejectModalDoc.title}</strong> ({rejectModalDoc.file_name}). The customer will see this message and be prompted to re-upload.
            </p>

            <div>
              <label className="label text-xs">Mandatory Rejection Reason <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., The Aadhaar scan is blurry. Please upload a high-resolution color PDF or JPEG."
                className="input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="btn btn-ghost btn-sm text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingDoc || !rejectionReason.trim()}
                className="btn btn-primary btn-sm text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isProcessingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: SCHEDULE SITE VISIT ─────────────────────────────────────── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form onSubmit={handleScheduleVisitSubmit} className="bg-card border border-border w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-text-primary">Schedule Site Visit for Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="label text-xs">Property ID / Project</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={schedulePropId}
                  onChange={(e) => setSchedulePropId(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-xs">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-xs">Time Slot</label>
                <select
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="input"
                >
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning)</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                  <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM (Evening)</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Special Instructions / Transport Notes</label>
                <textarea
                  rows={2}
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="e.g., Client requested dedicated cab pickup from BKC station."
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="btn btn-ghost btn-sm text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isScheduling}
                className="btn btn-primary btn-sm text-xs font-bold shadow-soft"
              >
                {isScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
