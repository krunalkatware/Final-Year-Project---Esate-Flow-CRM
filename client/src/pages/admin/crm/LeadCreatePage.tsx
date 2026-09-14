import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Mail, MapPin, DollarSign,
  Building, Sparkles, Plus, Check, ShieldAlert,
  Briefcase, Layers, Calendar, HelpCircle
} from 'lucide-react';
import { adminCRMApi } from '../../../api/admin-crm.api';
import { apiClient } from '../../../api/axios';
import { toast } from '../../../contexts/ToastContext';

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

const SOURCES = [
  { key: 'website', label: 'Website Inbound' },
  { key: 'google_ads', label: 'Google Ads' },
  { key: 'facebook_ads', label: 'Facebook Ads' },
  { key: 'instagram', label: 'Instagram Campaign' },
  { key: 'referral', label: 'Referral' },
  { key: 'builder', label: 'Builder Direct' },
  { key: 'walk_in', label: 'Walk-in' },
  { key: 'phone_call', label: 'Phone Call / Direct Dial' },
  { key: 'whatsapp', label: 'WhatsApp Chat' },
  { key: 'manual_entry', label: 'Manual Entry' },
];

const PRIORITIES = [
  { key: 'vip', label: '⭐ VIP (High Intent / HNI)' },
  { key: 'hot', label: '🔥 Hot (Ready within 30 days)' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export default function LeadCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillStage = searchParams.get('stage') || 'new';
  const prefillCustomerId = searchParams.get('customer_id') || '';
  const prefillPropertyId = searchParams.get('property_id') || '';
  const prefillBuilderId = searchParams.get('builder_id') || '';

  const [form, setForm] = useState({
    customer_id: prefillCustomerId,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    occupation: '',
    city: '',
    locality: '',
    budget_min: '',
    budget_max: '',
    preferred_bhk: '',
    preferred_property_type: 'apartment',
    buying_timeline: 'Immediate',
    investment_purpose: 'End Use',
    property_id: prefillPropertyId,
    builder_id: prefillBuilderId,
    stage: prefillStage,
    source: 'website',
    priority: 'medium',
    lead_score: '50',
    estimated_deal_value: '',
    notes_summary: '',
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [builders, setBuilders] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    loadDropdowns();
    if (prefillCustomerId) {
      loadCustomerDetails(prefillCustomerId);
    }
  }, [prefillCustomerId]);

  const loadDropdowns = async () => {
    try {
      const [propRes, builderRes] = await Promise.allSettled([
        apiClient.get('/properties', { params: { limit: 100 } }),
        apiClient.get('/builders', { params: { limit: 100 } }),
      ]);
      if (propRes.status === 'fulfilled') {
        const pData = propRes.value.data;
        setProperties(Array.isArray(pData) ? pData : pData?.properties || pData?.items || []);
      }
      if (builderRes.status === 'fulfilled') {
        const bData = builderRes.value.data;
        setBuilders(Array.isArray(bData) ? bData : bData?.builders || bData?.items || []);
      }
    } catch (e) {
      console.warn('Dropdown prefetch warning:', e);
    }
  };

  const loadCustomerDetails = async (custKey: string) => {
    setCustomerLoading(true);
    try {
      const res = await adminCRMApi.getCustomer360(custKey);
      if (res?.profile) {
        const p = res.profile;
        const nameParts = (p.full_name || '').split(' ');
        const fName = nameParts[0] || p.first_name || '';
        const lName = nameParts.slice(1).join(' ') || p.last_name || '';

        setForm(prev => ({
          ...prev,
          first_name: prev.first_name || fName,
          last_name: prev.last_name || lName,
          email: prev.email || p.email || '',
          phone: prev.phone || p.phone || '',
          city: prev.city || p.city || '',
        }));
        toast.success(`Pre-filled details from customer: ${p.full_name || p.email}`);
      }
    } catch (e) {
      console.error('Failed to prefetch customer info', e);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError('First name and phone number are required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload: Record<string, any> = {
        customer_id: form.customer_id.trim() || undefined,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        alternate_phone: form.alternate_phone.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        city: form.city.trim() || undefined,
        locality: form.locality.trim() || undefined,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : undefined,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
        preferred_bhk: form.preferred_bhk || undefined,
        preferred_property_type: form.preferred_property_type || undefined,
        buying_timeline: form.buying_timeline || 'Immediate',
        investment_purpose: form.investment_purpose || 'End Use',
        property_id: form.property_id ? parseInt(form.property_id, 10) : undefined,
        builder_id: form.builder_id ? parseInt(form.builder_id, 10) : undefined,
        stage: form.stage || 'new',
        source: form.source || 'website',
        priority: form.priority || 'medium',
        lead_score: form.lead_score ? parseInt(form.lead_score, 10) : 50,
        estimated_deal_value: form.estimated_deal_value ? parseFloat(form.estimated_deal_value) : undefined,
        notes_summary: form.notes_summary.trim() || undefined,
      };

      const res = await adminCRMApi.createLead(payload);
      toast.success(`Lead ${res.lead_number || 'created'} successfully!`);
      if (res?.lead_id) {
        navigate(`/admin/crm/leads/${res.lead_id}`);
      } else {
        navigate('/admin/crm/leads');
      }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Create New CRM Lead</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Register an inbound prospect, assign qualification score, and track through the sales pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to create lead</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {customerLoading && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Fetching customer information to prefill form...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Prospect Contact Details */}
        <div className="card p-5 sm:p-6 border border-border">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Prospect Contact Information</h2>
              <p className="text-xs text-text-secondary">Primary contact coordinates for this potential homebuyer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label font-medium text-xs">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Arjun"
                value={form.first_name}
                onChange={e => handleChange('first_name', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Mehta"
                value={form.last_name}
                onChange={e => handleChange('last_name', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="input pl-9 w-full"
                />
              </div>
            </div>

            <div>
              <label className="label font-medium text-xs">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  placeholder="arjun.mehta@example.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="input pl-9 w-full"
                />
              </div>
            </div>

            <div>
              <label className="label font-medium text-xs">Alternate Phone</label>
              <input
                type="tel"
                placeholder="+91 91234 56789"
                value={form.alternate_phone}
                onChange={e => handleChange('alternate_phone', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Occupation / Company</label>
              <input
                type="text"
                placeholder="e.g. VP at Infosys / Business Owner"
                value={form.occupation}
                onChange={e => handleChange('occupation', e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Requirements */}
        <div className="card p-5 sm:p-6 border border-border">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Requirements & Budget</h2>
              <p className="text-xs text-text-secondary">Target location, unit size, budget limits, and purchase intent</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label font-medium text-xs">Preferred City</label>
              <input
                type="text"
                placeholder="Mumbai / Pune / Bengaluru"
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Target Locality</label>
              <input
                type="text"
                placeholder="Bandra West / Worli"
                value={form.locality}
                onChange={e => handleChange('locality', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Budget Min (₹)</label>
              <input
                type="number"
                placeholder="e.g. 7500000"
                value={form.budget_min}
                onChange={e => handleChange('budget_min', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Budget Max (₹)</label>
              <input
                type="number"
                placeholder="e.g. 25000000"
                value={form.budget_max}
                onChange={e => handleChange('budget_max', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-medium text-xs">Preferred BHK</label>
              <select
                value={form.preferred_bhk}
                onChange={e => handleChange('preferred_bhk', e.target.value)}
                className="input w-full"
              >
                <option value="">Any Configuration</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5+">5+ BHK / Penthouse</option>
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Property Type</label>
              <select
                value={form.preferred_property_type}
                onChange={e => handleChange('preferred_property_type', e.target.value)}
                className="input w-full"
              >
                <option value="apartment">Apartment / Flat</option>
                <option value="villa">Villa / Independent House</option>
                <option value="penthouse">Penthouse</option>
                <option value="plot">Residential Plot</option>
                <option value="commercial">Commercial Office</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Buying Timeline</label>
              <select
                value={form.buying_timeline}
                onChange={e => handleChange('buying_timeline', e.target.value)}
                className="input w-full"
              >
                <option value="Immediate">Immediate (Within 15 Days)</option>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="Just Exploring">Just Exploring</option>
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Investment Purpose</label>
              <select
                value={form.investment_purpose}
                onChange={e => handleChange('investment_purpose', e.target.value)}
                className="input w-full"
              >
                <option value="End Use">End Use (Self Occupied)</option>
                <option value="Investment">Investment (Rental / ROI)</option>
                <option value="Holiday Home">Holiday / Second Home</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Property & Builder Association */}
        <div className="card p-5 sm:p-6 border border-border">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Property & Builder Association (Optional)</h2>
              <p className="text-xs text-text-secondary">Link an inquiry directly to a specific development project or builder catalog</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label font-medium text-xs">Interested Property</label>
              <select
                value={form.property_id}
                onChange={e => handleChange('property_id', e.target.value)}
                className="input w-full"
              >
                <option value="">— No Specific Property Selected —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title} ({p.city || p.location || 'Featured'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Preferred Builder / Developer</label>
              <select
                value={form.builder_id}
                onChange={e => handleChange('builder_id', e.target.value)}
                className="input w-full"
              >
                <option value="">— Any Builder / Developer —</option>
                {builders.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: CRM Classification & Pipeline State */}
        <div className="card p-5 sm:p-6 border border-border">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">CRM Classification & Pipeline State</h2>
              <p className="text-xs text-text-secondary">Assign pipeline stage, priority score, and estimated opportunity value</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label font-medium text-xs">Initial Stage</label>
              <select
                value={form.stage}
                onChange={e => handleChange('stage', e.target.value)}
                className="input w-full font-medium"
              >
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Lead Source</label>
              <select
                value={form.source}
                onChange={e => handleChange('source', e.target.value)}
                className="input w-full"
              >
                {SOURCES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs">Priority</label>
              <select
                value={form.priority}
                onChange={e => handleChange('priority', e.target.value)}
                className="input w-full font-semibold"
              >
                {PRIORITIES.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label font-medium text-xs flex items-center justify-between">
                <span>Lead Score (0–100)</span>
                <span className="font-bold text-primary">{form.lead_score}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.lead_score}
                onChange={e => handleChange('lead_score', e.target.value)}
                className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label font-medium text-xs">Estimated Deal Value (₹)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  placeholder="e.g. 15000000"
                  value={form.estimated_deal_value}
                  onChange={e => handleChange('estimated_deal_value', e.target.value)}
                  className="input pl-9 w-full font-semibold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="label font-medium text-xs">Linked Customer ID (Optional)</label>
              <input
                type="text"
                placeholder="User UUID or Customer Key"
                value={form.customer_id}
                onChange={e => handleChange('customer_id', e.target.value)}
                className="input w-full font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Notes & Requirements Summary */}
        <div className="card p-5 sm:p-6 border border-border">
          <label className="label font-semibold text-sm mb-2 block">Initial Notes & Requirements Summary</label>
          <textarea
            rows={4}
            value={form.notes_summary}
            onChange={e => handleChange('notes_summary', e.target.value)}
            placeholder="Record client conversation highlights, specific floor preference, payment terms, or urgency..."
            className="input w-full resize-none text-sm"
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={saving}
            className="btn btn-outline w-full sm:w-auto px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary w-full sm:w-auto px-8 gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" /> Creating Lead...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
