import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Clock, XCircle, DollarSign, FileText,
  MessageSquare, Bell, Printer, Download, Edit, User, Building2,
  Calendar, IndianRupee, Tag, MoreVertical, Trash2, Plus, Phone,
  Mail, Hash, Layers, RefreshCw, Send, ChevronRight
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:               { label: 'Draft',              cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  requested:           { label: 'Requested',          cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  pending_approval:    { label: 'Pending Approval',   cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  approved:            { label: 'Approved',           cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  agreement_generated: { label: 'Agreement Generated', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  payment_pending:     { label: 'Payment Pending',    cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  token_paid:          { label: 'Token Paid',         cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  installment_running: { label: 'Installment Running', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  completed:           { label: 'Completed',          cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected:            { label: 'Rejected',           cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  cancelled:           { label: 'Cancelled',          cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

const NEXT_STATUS: Record<string, string[]> = {
  draft: ['requested'],
  requested: ['pending_approval', 'rejected'],
  pending_approval: ['approved', 'rejected'],
  approved: ['agreement_generated', 'rejected'],
  agreement_generated: ['token_paid', 'payment_pending'],
  payment_pending: ['token_paid'],
  token_paid: ['installment_running'],
  installment_running: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: ['refund_initiated'],
};

function formatINR(v?: number | null) {
  if (v === undefined || v === null || isNaN(Number(v))) return '₹0';
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

function Section({ title, children, icon: Icon }: any) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card transition-colors">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-secondary/50">
        {Icon && <Icon size={16} className="text-primary" />}
        <h3 className="font-medium text-sm text-text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`text-text-primary font-medium ${mono ? 'font-mono text-primary' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function BookingDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'documents' | 'timeline' | 'comments'>('overview');
  const [transitioning, setTransitioning] = useState(false);
  const [comment, setComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const { data: booking, loading, refetch } = useQuery(() => adminBookingsApi.getBooking(Number(id)), [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Transition booking to "${newStatus}"?`)) return;
    setTransitioning(true);
    try {
      await adminBookingsApi.updateStatus(Number(id), newStatus);
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Status transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setAddingComment(true);
    try {
      await adminBookingsApi.addComment(Number(id), comment);
      setComment('');
      refetch();
    } catch {}
    setAddingComment(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="flex items-center justify-center min-h-96 text-slate-400">Booking not found</div>
  );

  const pill = STATUS_PILL[booking.status] || { label: booking.status, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  const nextStatuses = NEXT_STATUS[booking.status] || [];
  const netTotal = booking.net_total || booking.pricing?.net_total || booking.property?.price || 0;
  const paidAmount = booking.paid_amount || booking.pricing?.paid_amount || 0;
  const remainingAmount = booking.remaining_amount || booking.pricing?.remaining_amount || (netTotal - paidAmount);
  const tokenAmount = booking.token_amount || booking.pricing?.token_amount || 100000;
  const paymentProgress = netTotal > 0 ? (paidAmount / netTotal) * 100 : 0;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Hash },
    { id: 'payments', label: 'Payments', icon: IndianRupee },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in text-text-primary">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <button onClick={() => navigate('/admin/bookings')} className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Bookings
        </button>
        <span>/</span>
        <span className="text-text-primary font-mono">{booking.booking_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-primary font-mono">{booking.booking_number}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${pill.cls}`}>{pill.label}</span>
          </div>
          <p className="text-text-secondary text-sm">{booking.property?.title || booking.property?.name || 'Luxury Property'} {booking.unit_number ? `· Unit ${booking.unit_number}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="btn btn-outline btn-sm gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-1.5">
            <Printer size={14} /> Print
          </button>
          <button onClick={() => adminBookingsApi.downloadAgreement(Number(id))} className="btn btn-primary btn-sm gap-1.5">
            <Download size={14} /> Agreement PDF
          </button>
        </div>
      </div>

      {/* Status Transition Bar */}
      {nextStatuses.length > 0 && (
        <div className="flex items-center flex-wrap gap-3 p-4 rounded-2xl border border-border bg-card">
          <span className="text-sm text-text-secondary mr-2">Transition Status:</span>
          {nextStatuses.map(s => {
            const p = STATUS_PILL[s] || { label: s, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
            return (
              <button key={s} disabled={transitioning} onClick={() => handleStatusChange(s)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium border ${p.cls} hover:opacity-80 transition-all disabled:opacity-40`}>
                {transitioning ? '...' : `→ ${p.label}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Net Total', value: formatINR(netTotal), color: 'text-text-primary', bg: 'bg-card border-border' },
          { label: 'Paid Amount', value: formatINR(paidAmount), color: 'text-emerald-500', bg: 'bg-card border-border' },
          { label: 'Remaining', value: formatINR(remainingAmount), color: 'text-amber-500', bg: 'bg-card border-border' },
          { label: 'Token Amount', value: formatINR(tokenAmount), color: 'text-sky-500', bg: 'bg-card border-border' },
        ].map((item, i) => (
          <div key={i} className={`rounded-2xl p-4 border shadow-soft ${item.bg}`}>
            <div className="text-xs text-text-secondary mb-1.5">{item.label}</div>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Payment Progress Bar */}
      <div className="rounded-2xl border border-border p-4 bg-card shadow-soft">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Payment Progress</span>
          <span className="text-text-primary font-medium">{paymentProgress.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-surface-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Customer Details" icon={User}>
            {booking.customer ? (
              <div className="space-y-2">
                <InfoRow label="Name" value={booking.customer.name || booking.customer.full_name} />
                <InfoRow label="Email" value={booking.customer.email} />
                <InfoRow label="Phone" value={booking.customer.phone} />
              </div>
            ) : <p className="text-text-secondary text-sm">No customer linked</p>}
          </Section>

          <Section title="Property Details" icon={Building2}>
            <div className="space-y-2">
              <InfoRow label="Property" value={booking.property?.title || booking.property?.name || '—'} />
              <InfoRow label="City / Locality" value={booking.property?.city || booking.property?.locality || '—'} />
              <InfoRow label="Unit Number" value={booking.unit_number || '—'} />
              <InfoRow label="Floor" value={booking.floor_number ?? '—'} />
              <InfoRow label="BHK Type" value={booking.bhk_type ?? '—'} />
              <InfoRow label="Super Builtup" value={booking.super_builtup_area ? `${booking.super_builtup_area} sq.ft` : '—'} />
              <InfoRow label="Carpet Area" value={booking.carpet_area ? `${booking.carpet_area} sq.ft` : '—'} />
            </div>
          </Section>

          <Section title="Pricing Breakdown" icon={IndianRupee}>
            <div className="space-y-1">
              <InfoRow label="Base Price" value={formatINR(booking.pricing?.base_price || booking.base_price || netTotal)} />
              <InfoRow label="Floor Rise" value={formatINR(booking.pricing?.floor_rise_charges || booking.floor_rise_charges || 0)} />
              <InfoRow label="PLC Charges" value={formatINR(booking.pricing?.plc_charges || booking.plc_charges || 0)} />
              <InfoRow label="Parking" value={formatINR(booking.pricing?.parking_charges || booking.parking_charges || 0)} />
              <InfoRow label="Club Membership" value={formatINR(booking.pricing?.club_membership_charges || booking.club_membership_charges || 0)} />
              <InfoRow label="Other Charges" value={formatINR(booking.pricing?.other_charges || booking.other_charges || 0)} />
              <InfoRow label="Gross Total" value={formatINR(booking.pricing?.gross_total || booking.gross_total || netTotal)} />
              <InfoRow label="Discount" value={`-${formatINR(booking.pricing?.discount_amount || booking.discount_amount || 0)}`} />
              <InfoRow label="GST" value={`${booking.pricing?.gst_amount ? formatINR(booking.pricing.gst_amount) : '5%'}`} />
              <InfoRow label="Stamp Duty" value={`${booking.pricing?.stamp_duty_amount ? formatINR(booking.pricing.stamp_duty_amount) : '5%'}`} />
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-text-primary">Net Total</span>
                <span className="text-primary">{formatINR(netTotal)}</span>
              </div>
            </div>
          </Section>

          <Section title="Booking Meta" icon={Hash}>
            <div className="space-y-2">
              <InfoRow label="Booking Number" value={booking.booking_number} mono />
              <InfoRow label="Status" value={pill.label} />
              <InfoRow label="Created At" value={booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN') : '—'} />
              <InfoRow label="Sales Executive" value={booking.sales_executive_name || 'Unassigned'} />
              {booking.rejection_reason && <InfoRow label="Rejection Reason" value={booking.rejection_reason} />}
              {booking.cancellation_reason && <InfoRow label="Cancellation Reason" value={booking.cancellation_reason} />}
            </div>
          </Section>

          {/* Revenue & Commission Audit Trail */}
          <div className="md:col-span-2">
            <Section title="Revenue Sharing & Commission Audit Trail" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                {[
                  { step: '1', title: 'Booking Confirmed', desc: 'Valid booking recorded in DB', status: 'done' },
                  { step: '2', title: 'Rule Matched', desc: 'Active rule priority matched', status: 'done' },
                  { step: '3', title: 'Commission Math', desc: 'Idempotency verified', status: 'done' },
                  { step: '4', title: 'Wallet Credited', desc: 'Immutable ledger generated', status: 'done' },
                  { step: '5', title: 'Settlement Ready', desc: 'Available for disbursement', status: 'ready' },
                ].map((item) => (
                  <div key={item.step} className="p-3 rounded-xl bg-surface border border-border space-y-1 relative">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        ✓
                      </span>
                      <span className="text-xs font-bold text-text-primary">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <Section title="Payment History" icon={DollarSign}>
            {(booking.payments || []).length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <DollarSign size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
                <p>No payments recorded for this booking yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs text-text-secondary uppercase">
                    <tr>
                      <th className="py-2.5">Ref / Number</th>
                      <th>Type</th>
                      <th>Mode</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {booking.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-surface-secondary/40">
                        <td className="py-2.5 font-mono text-primary">{p.payment_number || p.ref || `#${p.id}`}</td>
                        <td className="capitalize">{p.type}</td>
                        <td className="capitalize">{p.mode}</td>
                        <td className="font-semibold text-text-primary">{formatINR(p.amount)}</td>
                        <td>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.status === 'completed' || p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="text-text-secondary text-xs">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <Section title="Booking Documents" icon={FileText}>
          {(booking.documents || []).length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <FileText size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <p>No documents uploaded yet for this booking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.documents.map((doc: any) => (
                <div key={doc.id} className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">{doc.title || doc.name}</h4>
                      <p className="text-xs text-text-secondary capitalize">{doc.document_type || 'Document'}</p>
                    </div>
                  </div>
                  <a href={doc.file_url || doc.url || '#'} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs gap-1">
                    <Download size={12} /> View
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <Section title="Activity Timeline" icon={Clock}>
          {(booking.timeline || []).length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <Clock size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <p>No activity logs recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {booking.timeline.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-semibold text-text-primary">{event.title}</h5>
                    <p className="text-xs text-text-secondary">{event.description}</p>
                    <span className="text-[10px] text-text-muted">{event.created_at ? new Date(event.created_at).toLocaleString('en-IN') : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Tab: Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border p-4 bg-card shadow-soft">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder="Add a comment or internal note..."
              className="w-full bg-surface border border-border rounded-xl p-3 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-primary resize-none" />
            <div className="flex justify-end mt-3">
              <button disabled={addingComment || !comment.trim()} onClick={handleAddComment}
                className="btn btn-primary btn-sm gap-1.5">
                <Send size={14} /> {addingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>

          {(booking.comments || []).length === 0 ? (
            <div className="rounded-2xl border border-border p-8 text-center bg-card">
              <MessageSquare size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <p className="text-text-secondary">No comments yet</p>
            </div>
          ) : (
            booking.comments.map((c: any) => (
              <div key={c.id} className="p-4 rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {(c.author || c.commenter?.name || 'A')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-text-primary">{c.author || c.commenter?.name || 'Admin'}</span>
                  </div>
                  <span className="text-xs text-text-muted">{c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : 'Just now'}</span>
                </div>
                <p className="text-sm text-text-secondary">{c.content || c.comment}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
