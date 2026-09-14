import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, DollarSign, Star, Clock,
  StickyNote, Bell, Activity, ChevronRight, ChevronDown,
  User, Building, Calendar, Flag, Tag, Plus, Check, X, Save,
  MessageSquare, Send, ExternalLink, Sparkles, CheckCircle2, PhoneCall
} from 'lucide-react';
import { adminCRMApi } from '../../../api/admin-crm.api';
import { LeadScoreGauge, calculateLeadScore } from '../../../components/crm/LeadScoreGauge';
import { toast } from '../../../contexts/ToastContext';

const STAGE_COLORS: Record<string, string> = {
  new: '#6366f1', contacted: '#3b82f6', interested: '#06b6d4',
  site_visit_scheduled: '#10b981', negotiation: '#f59e0b',
  booking_requested: '#f97316', booked: '#22c55e', lost: '#ef4444', closed: '#8b5cf6',
};
const PRIORITY_CONFIG: Record<string, { label: string; bg: string }> = {
  vip: { label: 'VIP', bg: '#7c3aed' }, hot: { label: 'Hot', bg: '#ef4444' },
  high: { label: 'High', bg: '#f97316' }, medium: { label: 'Medium', bg: '#3b82f6' },
  low: { label: 'Low', bg: '#6b7280' },
};

const STAGES = [
  { key: 'new', label: 'New Inbound' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'booking_requested', label: 'Booking Requested' },
  { key: 'booked', label: 'Booked / Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'closed', label: 'Closed' },
];

type Tab = 'overview' | 'timeline' | 'notes' | 'reminders';

export default function LeadDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderType, setReminderType] = useState('call');
  const [savingReminder, setSavingReminder] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    if (id) loadLead();
  }, [id]);

  const loadLead = async () => {
    const leadId = parseInt(id || '', 10);
    if (isNaN(leadId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminCRMApi.getLeadDetail(leadId);
      setLead(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load lead profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.stage === newStage) return;
    setUpdatingStage(true);
    try {
      await adminCRMApi.updateStage(lead.id, newStage, `Stage updated to ${newStage.replace(/_/g, ' ')} via Lead Details header.`);
      toast.success(`Lead moved to ${newStage.replace(/_/g, ' ').toUpperCase()}`);
      loadLead();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to update lead stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleQuickCall = async () => {
    if (!lead?.phone) {
      toast.error('No phone number available for this lead');
      return;
    }
    window.open(`tel:${lead.phone}`, '_self');
    try {
      await adminCRMApi.addNote(lead.id, `📞 Outbound Call placed to ${lead.phone} at ${new Date().toLocaleTimeString()}`);
      loadLead();
    } catch (e) {
      console.warn('Call log note error:', e);
    }
  };

  const handleWhatsAppOutreach = async (type: 'brochure' | 'visit' | 'cost' | 'followup') => {
    if (!lead?.phone) {
      toast.error('No phone number available for WhatsApp outreach');
      return;
    }
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let messageText = '';
    const propName = lead.property_name || 'your shortlisted luxury property';
    const clientName = lead.first_name || 'there';

    if (type === 'brochure') {
      messageText = `Hi ${clientName}, greetings from EstateFlow! Sharing the detailed e-brochure and floor plans for ${propName}. Let me know if you would like me to arrange a virtual or private site walkthrough.`;
    } else if (type === 'visit') {
      messageText = `Hi ${clientName}, we have scheduled VIP site visits for ${propName} this week. Would you prefer a morning (11 AM) or afternoon (3 PM) slot? Free pick-up assistance is available!`;
    } else if (type === 'cost') {
      messageText = `Hi ${clientName}, based on your requirement for ${lead.preferred_bhk || 'property'} in ${lead.city || 'prime location'}, here is the customized pricing and payment schedule. Feel free to review!`;
    } else {
      messageText = `Hi ${clientName}, this is following up on your inquiry with EstateFlow regarding ${propName}. How may we assist your property search today?`;
    }

    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');

    try {
      await adminCRMApi.addNote(lead.id, `💬 WhatsApp Message Sent (${type.toUpperCase()} template) at ${new Date().toLocaleTimeString()}`);
      toast.success('WhatsApp outreach initiated & logged to activity!');
      loadLead();
    } catch (e) {
      console.warn('WhatsApp note log error:', e);
    }
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.email) {
      toast.error('No email address for this lead');
      return;
    }
    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    try {
      await adminCRMApi.addNote(lead.id, `✉️ Email Sent: "${emailSubject}" at ${new Date().toLocaleTimeString()}`);
      toast.success('Email client opened & recorded in CRM timeline');
      setShowEmailModal(false);
      loadLead();
    } catch (e) {
      console.warn('Email note log error:', e);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;
    setSavingNote(true);
    try {
      await adminCRMApi.addNote(parseInt(id), noteContent.trim());
      setNoteContent('');
      loadLead();
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate || !id) return;
    setSavingReminder(true);
    try {
      await adminCRMApi.addReminder(parseInt(id), {
        title: reminderTitle,
        reminder_type: reminderType,
        due_date: reminderDate,
      });
      setReminderTitle('');
      setReminderDate('');
      loadLead();
    } finally {
      setSavingReminder(false);
    }
  };

  const formatCurrency = (v?: number) => {
    if (!v) return '—';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    return `₹${v.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-border rounded-xl w-64" />
        <div className="h-48 bg-border rounded-2xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-text-secondary">
        Lead not found.
      </div>
    );
  }

  const stageColor = STAGE_COLORS[lead.stage] || '#6366f1';
  const prioConfig = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/admin/crm/leads')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      {/* Header Card */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {lead.first_name[0]}{lead.last_name?.[0] || ''}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-heading font-bold text-text-primary">{lead.full_name}</h1>
              <span className="text-xs font-semibold text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">{lead.lead_number}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: prioConfig.bg }}>{prioConfig.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
              {lead.phone && (
                <button
                  onClick={handleQuickCall}
                  className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  title="Click to place phone call"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono">{lead.phone}</span>
                </button>
              )}
              {lead.email && (
                <button
                  onClick={() => {
                    setEmailSubject(`Information regarding your property inquiry - ${lead.property_name || 'EstateFlow'}`);
                    setEmailBody(`Hi ${lead.first_name},\n\nThank you for reaching out to EstateFlow. We are happy to assist you with your property search.\n\nBest regards,\nEstateFlow CRM Team`);
                    setShowEmailModal(true);
                  }}
                  className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  title="Click to compose email"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{lead.email}</span>
                </button>
              )}
              {lead.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Stage:</span>
              <select
                value={lead.stage}
                disabled={updatingStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="input input-sm font-bold text-xs py-1 px-2.5 rounded-xl border"
                style={{ borderColor: stageColor }}
              >
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            <LeadScoreGauge
              score={lead.lead_score || calculateLeadScore({
                priority: lead.priority,
                budget_max: lead.budget_max,
                stage: lead.stage,
                visit_count: lead.site_visits_count,
                activities_count: lead.activities?.length,
              })}
              trend={lead.score_trend as any}
              size="md"
              showLabel={true}
              animated={true}
            />
          </div>
        </div>

        {/* Quick Sales Action & WhatsApp Outreach Strip */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-surface-secondary/40 -mx-6 -mb-6 p-4 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Instant Outreach Triggers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Click to Call */}
            <button
              onClick={handleQuickCall}
              className="btn btn-outline btn-xs gap-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Agent
            </button>

            {/* WhatsApp Template Triggers */}
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 p-0.5 rounded-xl">
              <button
                onClick={() => handleWhatsAppOutreach('brochure')}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-1"
                title="Send Brochure via WhatsApp"
              >
                <MessageSquare className="w-3 h-3" /> WhatsApp Brochure
              </button>
              <button
                onClick={() => handleWhatsAppOutreach('visit')}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-1"
                title="Invite to Site Visit via WhatsApp"
              >
                <Calendar className="w-3 h-3" /> Schedule Visit
              </button>
              <button
                onClick={() => handleWhatsAppOutreach('cost')}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-1"
                title="Send Cost Breakdown via WhatsApp"
              >
                <DollarSign className="w-3 h-3" /> Cost Sheet
              </button>
            </div>

            {/* Email Composer Button */}
            {lead.email && (
              <button
                onClick={() => {
                  setEmailSubject(`Property Update for ${lead.first_name} - EstateFlow`);
                  setEmailBody(`Hi ${lead.first_name},\n\nWe have updated pricing and availability for ${lead.property_name || 'properties in your area'}.\n\nLet us know when you would like to connect.`);
                  setShowEmailModal(true);
                }}
                className="btn btn-outline btn-xs gap-1 text-xs"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border overflow-x-auto">
        {(['overview', 'timeline', 'notes', 'reminders'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl capitalize transition-all ${
              activeTab === tab ? 'bg-card shadow-soft text-primary font-bold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Details */}
          <div className="card p-5 space-y-4">
            <h3 className="font-heading font-semibold text-text-primary">Lead Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Source', value: lead.source?.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
                { label: 'Budget Range', value: `${formatCurrency(lead.budget_min)} – ${formatCurrency(lead.budget_max)}` },
                { label: 'Property Type', value: lead.preferred_property_type || '—' },
                { label: 'Preferred BHK', value: lead.preferred_bhk ? `${lead.preferred_bhk} BHK` : '—' },
                { label: 'Buying Timeline', value: lead.buying_timeline || '—' },
                { label: 'Investment Purpose', value: lead.investment_purpose || '—' },
                { label: 'Est. Deal Value', value: formatCurrency(lead.estimated_deal_value) },
                { label: 'Assigned To', value: lead.assigned_agent_name || 'Unassigned' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold text-text-primary text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage History */}
          <div className="card p-5 space-y-4">
            <h3 className="font-heading font-semibold text-text-primary">Stage History</h3>
            {lead.stage_history?.length === 0 && (
              <p className="text-sm text-text-secondary">No stage transitions yet.</p>
            )}
            <div className="space-y-3">
              {lead.stage_history?.map((h: any, i: number) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {h.old_stage ? `${h.old_stage.replace(/_/g,' ')} → ` : ''}{h.new_stage.replace(/_/g,' ')}
                    </p>
                    <p className="text-xs text-text-secondary">{h.changed_by} • {h.created_at ? new Date(h.created_at).toLocaleString() : ''}</p>
                    {h.notes && <p className="text-xs text-text-secondary mt-0.5 italic">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-heading font-semibold text-text-primary">Activity Timeline</h3>
          {lead.activities?.length === 0 && <p className="text-sm text-text-secondary">No activities yet.</p>}
          <div className="space-y-3">
            {lead.activities?.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary text-sm">{a.title}</p>
                  {a.description && <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>}
                  <p className="text-xs text-text-secondary mt-1">{a.performed_by} • {a.created_at ? new Date(a.created_at).toLocaleString() : ''}</p>
                </div>
                <span className="text-xs bg-surface border border-border rounded-full px-2 py-0.5 text-text-secondary flex-shrink-0">{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add Note */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-text-primary mb-3">Add Note</h3>
            <textarea
              className="input h-24 resize-none w-full mb-3"
              placeholder="Add an internal note about this lead..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            />
            <button onClick={handleAddNote} disabled={savingNote || !noteContent.trim()} className="btn-primary btn-sm gap-2">
              <Save className="w-4 h-4" /> {savingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
          {/* Existing Notes */}
          <div className="card p-5 space-y-3">
            <h3 className="font-heading font-semibold text-text-primary">Notes ({lead.notes?.length || 0})</h3>
            {lead.notes?.length === 0 && <p className="text-sm text-text-secondary">No notes yet.</p>}
            {lead.notes?.map((n: any) => (
              <div key={n.id} className={`p-3 rounded-xl border ${n.is_pinned ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-secondary">{n.created_by} • {n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                  {n.is_pinned && <span className="text-xs text-amber-600 font-semibold">📌 Pinned</span>}
                </div>
                <p className="text-sm text-text-primary">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {/* Add Reminder */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-text-primary mb-3">Schedule Follow-up</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input className="input" placeholder="Reminder title..." value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} />
              <select className="input" value={reminderType} onChange={e => setReminderType(e.target.value)}>
                {['call','meeting','visit','email','follow_up'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <input type="datetime-local" className="input" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
            </div>
            <button onClick={handleAddReminder} disabled={savingReminder || !reminderTitle.trim() || !reminderDate} className="btn-primary btn-sm gap-2">
              <Bell className="w-4 h-4" /> {savingReminder ? 'Scheduling...' : 'Schedule Reminder'}
            </button>
          </div>
          {/* Existing Reminders */}
          <div className="card p-5 space-y-3">
            <h3 className="font-heading font-semibold text-text-primary">Upcoming Reminders ({lead.reminders?.length || 0})</h3>
            {lead.reminders?.length === 0 && <p className="text-sm text-text-secondary">No reminders scheduled.</p>}
            {lead.reminders?.map((r: any) => (
              <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.status === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-surface border-border opacity-60'}`}>
                <Bell className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{r.title}</p>
                  <p className="text-xs text-text-secondary">{r.type} • {r.due_date ? new Date(r.due_date).toLocaleString() : '—'}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Email Composer Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-text-primary rounded-3xl border border-border shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-secondary/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/15 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-text-primary">Send Email to {lead.first_name}</h3>
                  <p className="text-xs text-text-secondary">{lead.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="p-5 space-y-4">
              <div>
                <label className="label text-xs font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold">Message Body</label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="input text-xs w-full resize-none font-sans"
                />
              </div>

              {/* Template shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-text-secondary font-medium mr-1">Templates:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSubject(`Luxury Property Options for ${lead.first_name} - EstateFlow`);
                    setEmailBody(`Hi ${lead.first_name},\n\nWe have curated exclusive property options that match your budget (${lead.budget_max ? `up to ₹${(lead.budget_max/10000000).toFixed(1)} Cr` : 'requirement'}). Please find our recommendations attached.\n\nWarm regards,\nEstateFlow Team`);
                  }}
                  className="text-[10px] px-2 py-1 bg-surface border border-border rounded-lg hover:border-primary/50 text-text-secondary hover:text-primary"
                >
                  Curated Catalog
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSubject(`Site Visit Confirmation - ${lead.property_name || 'EstateFlow Experience'}`);
                    setEmailBody(`Hi ${lead.first_name},\n\nThis email confirms your upcoming VIP site visit appointment. Our senior consultant will receive you at the project gallery.\n\nFor any changes, please reply to this email.\n\nBest regards,\nEstateFlow`);
                  }}
                  className="text-[10px] px-2 py-1 bg-surface border border-border rounded-lg hover:border-primary/50 text-text-secondary hover:text-primary"
                >
                  Visit Confirmation
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Send className="w-4 h-4" /> Open in Mail Client & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
