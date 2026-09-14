import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Home,
  MessageSquare, Bell, Printer, Download, Star, Sparkles,
  Send, RefreshCw, CheckCircle, ShieldAlert, Navigation
} from 'lucide-react';
import useQuery from '../../../hooks/useQuery';
import { adminSiteVisitsApi } from '../../../api/admin-site-visits.api';

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:       { label: 'Draft',       cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  in_transit:  { label: 'In Transit',  cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  arrived:     { label: 'Arrived',     cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  no_show:     { label: 'No Show',     cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function SiteVisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'feedback' | 'comments'>('overview');
  const [commentText, setCommentText] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: visit, loading, refetch } = useQuery(() => adminSiteVisitsApi.getSiteVisit(Number(id)), [id]);

  const handleStatus = async (status: string) => {
    if (!confirm(`Update visit status to "${status}"?`)) return;
    setUpdating(true);
    try {
      await adminSiteVisitsApi.updateStatus(Number(id), status);
      refetch();
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckIn = async () => {
    setUpdating(true);
    try {
      await adminSiteVisitsApi.checkIn(Number(id), { latitude: 19.0760, longitude: 72.8777 });
      refetch();
    } catch {
      alert("Check in failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckOut = async () => {
    setUpdating(true);
    try {
      await adminSiteVisitsApi.checkOut(Number(id), { latitude: 19.0760, longitude: 72.8777 });
      refetch();
    } catch {
      alert("Check out failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setUpdating(true);
    try {
      await adminSiteVisitsApi.addComment(Number(id), commentText);
      setCommentText('');
      refetch();
    } catch {
      alert("Comment failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!visit) return (
    <div className="flex items-center justify-center min-h-96 text-slate-400">Site Visit not found</div>
  );

  const pill = STATUS_PILL[visit.status] ?? { label: visit.status, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate('/admin/site-visits/list')} className="hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to List
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white font-mono">{visit.visit_number}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${pill.cls}`}>{pill.label}</span>
          </div>
          <p className="text-slate-400 text-sm">{visit.property?.title ?? 'N/A'} · {visit.visit_type}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold">
            <RefreshCw size={14} />
          </button>
          {visit.status === 'scheduled' && (
            <button disabled={updating} onClick={handleCheckIn}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all shadow-md">
              Check-In GPS
            </button>
          )}
          {visit.status === 'arrived' && (
            <button disabled={updating} onClick={handleCheckOut}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-md">
              Check-Out GPS
            </button>
          )}
        </div>
      </div>

      {/* Status Transition Bar */}
      <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-slate-700/50" style={{ background: 'var(--bg-card)' }}>
        <span className="text-xs text-slate-400 self-center mr-2">Quick Actions:</span>
        {['scheduled', 'in_transit', 'completed', 'cancelled', 'no_show'].map(st => (
          <button key={st} disabled={updating || visit.status === st} onClick={() => handleStatus(st)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider border border-slate-700 hover:border-slate-500 transition-all text-slate-300 disabled:opacity-40`}>
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700/50">
            {[
              { id: 'overview', label: 'Details' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'feedback', label: 'Feedback & Score' },
              { id: 'comments', label: 'Comments' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Details Content */}
          <div className="p-6 rounded-2xl border border-slate-700/50 space-y-4" style={{ background: 'var(--bg-card)' }}>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs text-slate-500 mb-1">Customer Account</h3>
                  <div className="text-sm font-semibold text-white">{visit.customer?.name ?? 'Anonymous'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{visit.customer?.phone}</div>
                </div>
                <div>
                  <h3 className="text-xs text-slate-500 mb-1">Property Site</h3>
                  <div className="text-sm font-semibold text-white">{visit.property?.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{visit.property?.locality}</div>
                </div>
                <div>
                  <h3 className="text-xs text-slate-500 mb-1">Scheduled Date & Time</h3>
                  <div className="text-sm font-semibold text-white">
                    {new Date(visit.scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{visit.scheduled_time}</div>
                </div>
                <div>
                  <h3 className="text-xs text-slate-500 mb-1">Sales Representative</h3>
                  <div className="text-sm font-semibold text-white">{visit.sales_executive?.name ?? 'Unassigned'}</div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {visit.timeline.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-4">No events logged</div>
                ) : (
                  <div className="relative pl-4 space-y-4 border-l border-slate-700/50 ml-2">
                    {visit.timeline.map((t) => (
                      <div key={t.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-900" />
                        <div className="text-xs font-semibold text-white">{t.title}</div>
                        {t.description && <div className="text-[10px] text-slate-400 mt-0.5">{t.description}</div>}
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {new Date(t.created_at).toLocaleString('en-IN')} by {t.performed_by ?? 'System'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="space-y-4">
                {visit.feedbacks.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-4">No feedback captured yet</div>
                ) : (
                  visit.feedbacks.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/20">
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-200">{f.comments}</p>
                      <div className="text-[10px] text-slate-500 mt-2">
                        Logged on {new Date(f.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Input */}
                <div className="flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder="Write internal note..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/30 text-white focus:outline-none focus:border-indigo-500 text-xs" />
                  <button onClick={handleComment} className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all">
                    <Send size={14} />
                  </button>
                </div>
                {/* Comments List */}
                <div className="space-y-3">
                  {visit.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/10">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-white">{c.author}</span>
                        <span>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-200">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Actions Checklist */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-slate-700/50 space-y-4" style={{ background: 'var(--bg-card)' }}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Actions</h3>
            <button onClick={() => navigate(`/admin/site-visits/${id}/routes`)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/20 transition-all text-left">
              <div>
                <div className="text-xs font-semibold text-white">Route Guide</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Optimize site coordinates</div>
              </div>
              <Navigation size={14} className="text-indigo-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
