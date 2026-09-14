import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, DollarSign, Building } from 'lucide-react';
import { adminCRMApi } from '../../../api/admin-crm.api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const STAGES = ['new','contacted','interested','site_visit_scheduled','negotiation','booking_requested','booked','lost','closed'];
const SOURCES = ['website','google_ads','facebook_ads','instagram','referral','builder','walk_in','phone_call','whatsapp','manual_entry'];
const PRIORITIES = ['low','medium','high','hot','vip'];

export default function LeadFormModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    locality: '',
    budget_min: '',
    budget_max: '',
    preferred_bhk: '',
    preferred_property_type: 'apartment',
    buying_timeline: 'Immediate',
    investment_purpose: 'End Use',
    stage: 'new',
    source: 'website',
    priority: 'medium',
    lead_score: '50',
    estimated_deal_value: '',
    notes_summary: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.phone) {
      setError('First name and phone number are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, any> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        city: form.city.trim() || undefined,
        locality: form.locality.trim() || undefined,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : undefined,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
        preferred_bhk: form.preferred_bhk || undefined,
        preferred_property_type: form.preferred_property_type || undefined,
        buying_timeline: form.buying_timeline || 'Immediate',
        investment_purpose: form.investment_purpose || 'End Use',
        stage: form.stage || 'new',
        source: form.source || 'website',
        priority: form.priority || 'medium',
        lead_score: form.lead_score ? parseInt(form.lead_score, 10) : 50,
        estimated_deal_value: form.estimated_deal_value ? parseFloat(form.estimated_deal_value) : undefined,
        notes_summary: form.notes_summary.trim() || undefined,
      };
      await adminCRMApi.createLead(payload);
      onSuccess();
    } catch (e: any) {
      let msg = 'Failed to create lead';
      if (e?.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          msg = e.response.data.detail.map((d: any) => d.msg || 'Invalid field').join(', ');
        } else if (typeof e.response.data.detail === 'string') {
          msg = e.response.data.detail;
        }
      } else if (e?.response?.data?.error) {
        msg = e.response.data.error;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-bg z-10">
          <div>
            <h2 className="text-lg font-heading font-bold text-text-primary">New Lead</h2>
            <p className="text-xs text-text-secondary">Add a prospect to the CRM pipeline</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-sm">{error}</div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">First Name *</label>
                <input className="input" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="Arjun" required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Sharma" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 98200 12345" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="arjun@gmail.com" />
              </div>
            </div>
          </div>

          {/* Location & Budget */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Location & Budget
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="Mumbai" />
              </div>
              <div>
                <label className="label">Locality</label>
                <input className="input" value={form.locality} onChange={e => handleChange('locality', e.target.value)} placeholder="Bandra West" />
              </div>
              <div>
                <label className="label">Budget Min (₹)</label>
                <input type="number" className="input" value={form.budget_min} onChange={e => handleChange('budget_min', e.target.value)} placeholder="5000000" />
              </div>
              <div>
                <label className="label">Budget Max (₹)</label>
                <input type="number" className="input" value={form.budget_max} onChange={e => handleChange('budget_max', e.target.value)} placeholder="20000000" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" /> Property Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Preferred BHK</label>
                <select className="input" value={form.preferred_bhk} onChange={e => handleChange('preferred_bhk', e.target.value)}>
                  <option value="">Any</option>
                  {['1','2','3','4','5'].map(b => <option key={b} value={b}>{b} BHK</option>)}
                </select>
              </div>
              <div>
                <label className="label">Property Type</label>
                <select className="input" value={form.preferred_property_type} onChange={e => handleChange('preferred_property_type', e.target.value)}>
                  {['apartment','villa','penthouse','plot','commercial','studio'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Buying Timeline</label>
                <select className="input" value={form.buying_timeline} onChange={e => handleChange('buying_timeline', e.target.value)}>
                  {['Immediate','1 Month','3 Months','6 Months','1 Year','Just Exploring'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CRM Fields */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">CRM Classification</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Stage</label>
                <select className="input" value={form.stage} onChange={e => handleChange('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" value={form.source} onChange={e => handleChange('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Lead Score (0–100)</label>
                <input type="number" min="0" max="100" className="input" value={form.lead_score} onChange={e => handleChange('lead_score', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input h-20 resize-none"
              value={form.notes_summary}
              onChange={e => handleChange('notes_summary', e.target.value)}
              placeholder="Initial requirements, how they found us, any specific preferences..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
