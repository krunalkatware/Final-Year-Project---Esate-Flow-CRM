import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Home, Calendar, Clock, Navigation, CheckCircle,
  Save, AlertCircle, ChevronLeft, ChevronRight, HardHat, Shield,
  Search, Phone, Mail, MapPin, Star, Building2, Users, Zap
} from 'lucide-react';
import { adminSiteVisitsApi } from '../../../api/admin-site-visits.api';
import { apiClient } from '../../../api/axios';

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Property', icon: Home },
  { id: 3, label: 'Builder', icon: HardHat },
  { id: 4, label: 'Rep Assign', icon: Shield },
  { id: 5, label: 'Schedule', icon: Calendar },
  { id: 6, label: 'Transport', icon: Navigation },
  { id: 7, label: 'Review', icon: CheckCircle },
  { id: 8, label: 'Confirm', icon: CheckCircle },
];

export default function SiteVisitWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<any>(null);

  // Data states for dropdowns
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [builders, setBuilders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search states
  const [propSearch, setPropSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');

  const [form, setForm] = useState({
    customer_id: '',
    lead_id: '',
    property_id: '',
    builder_id: '',
    sales_executive_id: '',
    visit_type: 'physical',
    scheduled_date: '',
    scheduled_time: '10:00',
    expected_duration: 60,
    transport_required: false,
    pickup_location: '',
    drop_location: '',
    notes: '',
    priority: 'medium',
    purpose: 'property_viewing',
  });

  // Load data on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [propRes, leadRes, custRes, staffRes, builderRes] = await Promise.allSettled([
          apiClient.get('/admin/properties', { headers }),
          apiClient.get('/admin/crm/leads', { headers }),
          apiClient.get('/admin/customers', { headers }),
          apiClient.get('/admin/users', { headers }),
          apiClient.get('/admin/builders', { headers }),
        ]);
        if (propRes.status === 'fulfilled') setProperties(Array.isArray(propRes.value.data) ? propRes.value.data : propRes.value.data?.items || []);
        if (leadRes.status === 'fulfilled') setLeads(Array.isArray(leadRes.value.data) ? leadRes.value.data : leadRes.value.data?.items || []);
        if (custRes.status === 'fulfilled') setCustomers(Array.isArray(custRes.value.data) ? custRes.value.data : custRes.value.data?.items || []);
        if (staffRes.status === 'fulfilled') setStaffList(Array.isArray(staffRes.value.data) ? staffRes.value.data : staffRes.value.data?.items || []);
        if (builderRes.status === 'fulfilled') setBuilders(Array.isArray(builderRes.value.data) ? builderRes.value.data : builderRes.value.data?.items || []);
      } catch (e) {
        // Silent fail - fallback to manual entry
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  // Draft recovery
  useEffect(() => {
    const saved = localStorage.getItem('ef_visit_draft');
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch {}
    }
  }, []);

  const update = (k: string, v: any) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      localStorage.setItem('ef_visit_draft', JSON.stringify(next));
      return next;
    });
  };

  const handleCreate = async () => {
    if (!form.property_id) return alert("Please select a property");
    if (!form.scheduled_date) return alert("Please select a scheduled date");
    setSaving(true);
    try {
      // Combine date + time
      const scheduledDateTime = form.scheduled_date && form.scheduled_time
        ? new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString()
        : new Date().toISOString();

      const payload: any = {
        ...form,
        property_id: Number(form.property_id),
        builder_id: form.builder_id ? Number(form.builder_id) : undefined,
        lead_id: form.lead_id ? Number(form.lead_id) : undefined,
        sales_executive_id: form.sales_executive_id ? Number(form.sales_executive_id) : undefined,
        customer_id: form.customer_id || undefined,
        expected_duration: Number(form.expected_duration),
        scheduled_date: scheduledDateTime,
      };

      // Remove empty strings
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === undefined) delete payload[k];
      });

      const res = await adminSiteVisitsApi.createSiteVisit(payload);
      setCreated(res);
      localStorage.removeItem('ef_visit_draft');
      setStep(8);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail 
        : Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ')
        : "Error scheduling site visit. Please check all required fields.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedProperty = properties.find(p => String(p.id) === String(form.property_id));
  const selectedCustomer = customers.find(c => c.id === form.customer_id || c.user_id === form.customer_id);
  const selectedLead = leads.find(l => String(l.id) === String(form.lead_id));
  const selectedBuilder = builders.find(b => String(b.id) === String(form.builder_id));
  const selectedStaff = staffList.find(s => String(s.id) === String(form.sales_executive_id));

  const filteredProps = properties.filter(p =>
    !propSearch || (p.title || p.name || '').toLowerCase().includes(propSearch.toLowerCase()) ||
    String(p.id).includes(propSearch)
  );
  const filteredCustomers = customers.filter(c =>
    !custSearch || (c.full_name || c.name || c.email || '').toLowerCase().includes(custSearch.toLowerCase())
  );

  const cardClass = "p-4 rounded-xl border cursor-pointer transition-all text-left w-full";
  const selectedCardClass = `${cardClass} border-indigo-500 bg-indigo-500/10`;
  const normalCardClass = `${cardClass} border-slate-700/50 hover:border-indigo-400/40 bg-slate-900/40`;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 1 — Customer Identification</h2>
              <p className="text-xs text-slate-400">Search and select a customer, or link a CRM Lead.</p>
            </div>

            {/* Customer Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Search Customer</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              {custSearch && filteredCustomers.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
                  {filteredCustomers.slice(0, 5).map(c => (
                    <button key={c.id || c.user_id} onClick={() => { update('customer_id', c.id || c.user_id); setCustSearch(''); }}
                      className={String(form.customer_id) === String(c.id || c.user_id) ? selectedCardClass : normalCardClass}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                          {(c.full_name || c.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.full_name || c.name}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {form.customer_id && selectedCustomer && (
                <div className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedCustomer.full_name || selectedCustomer.name}</p>
                    <p className="text-xs text-slate-400">{selectedCustomer.email}</p>
                  </div>
                  <button onClick={() => update('customer_id', '')} className="ml-auto text-xs text-slate-400 hover:text-white">✕ Clear</button>
                </div>
              )}
              {!form.customer_id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mt-3 mb-1.5">Or enter Customer UUID manually</label>
                  <input value={form.customer_id} onChange={e => update('customer_id', e.target.value)}
                    placeholder="UUID (optional – can assign later)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                </div>
              )}
            </div>

            {/* Lead Linkage */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Link CRM Lead (Optional)</label>
              {leads.length > 0 ? (
                <select value={form.lead_id} onChange={e => update('lead_id', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm">
                  <option value="">— No Lead Linked —</option>
                  {leads.slice(0, 50).map(l => (
                    <option key={l.id} value={l.id}>#{l.id} - {l.full_name || l.name || l.customer_name} ({l.status})</option>
                  ))}
                </select>
              ) : (
                <input value={form.lead_id} onChange={e => update('lead_id', e.target.value)}
                  type="number" placeholder="Lead ID (optional)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs text-blue-300">
              💡 Visits can be created without a customer and assigned later before dispatch.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 2 — Property Selection</h2>
              <p className="text-xs text-slate-400">Search and select the property for the site visit.</p>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input value={propSearch} onChange={e => setPropSearch(e.target.value)}
                placeholder="Search properties by name, ID, location..."
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>

            {properties.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProps.slice(0, 20).map(p => (
                  <button key={p.id} onClick={() => { update('property_id', String(p.id)); if (p.builder_id) update('builder_id', String(p.builder_id)); }}
                    className={String(form.property_id) === String(p.id) ? selectedCardClass : normalCardClass}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <Home size={14} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.title || p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">ID: {p.id}</span>
                          {p.locality && <span className="text-xs text-slate-400">· {p.locality}</span>}
                          {p.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{p.status}</span>}
                        </div>
                      </div>
                      {String(form.property_id) === String(p.id) && <CheckCircle size={16} className="text-indigo-400 flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Property ID <span className="text-red-400">*</span></label>
                <input value={form.property_id} onChange={e => update('property_id', e.target.value)}
                  type="number" placeholder="Enter Property ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
            )}
            {!form.property_id && (
              <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Property is required to proceed</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 3 — Builder Assignment</h2>
              <p className="text-xs text-slate-400">Link the property's builder/developer.</p>
            </div>
            {builders.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button onClick={() => update('builder_id', '')}
                  className={!form.builder_id ? selectedCardClass : normalCardClass}>
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">Auto-resolve from Property</p>
                      <p className="text-xs text-slate-400">Recommended — builder will be inferred from selected property</p>
                    </div>
                  </div>
                </button>
                {builders.slice(0, 20).map(b => (
                  <button key={b.id} onClick={() => update('builder_id', String(b.id))}
                    className={String(form.builder_id) === String(b.id) ? selectedCardClass : normalCardClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <HardHat size={14} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{b.name || b.company_name}</p>
                        {b.city && <p className="text-xs text-slate-400">{b.city}</p>}
                      </div>
                      {String(form.builder_id) === String(b.id) && <CheckCircle size={16} className="text-indigo-400 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Builder ID (Optional)</label>
                <input value={form.builder_id} onChange={e => update('builder_id', e.target.value)}
                  type="number" placeholder="Leave blank for auto-resolve"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 4 — Sales Rep Assignment</h2>
              <p className="text-xs text-slate-400">Assign a sales executive to escort the customer.</p>
            </div>
            {staffList.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button onClick={() => update('sales_executive_id', '')}
                  className={!form.sales_executive_id ? selectedCardClass : normalCardClass}>
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">Auto Round-Robin Assignment</p>
                      <p className="text-xs text-slate-400">System auto-assigns using sequential allocation</p>
                    </div>
                  </div>
                </button>
                {staffList.slice(0, 20).map(s => (
                  <button key={s.id} onClick={() => update('sales_executive_id', String(s.id))}
                    className={String(form.sales_executive_id) === String(s.id) ? selectedCardClass : normalCardClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                        {(s.first_name || s.full_name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.full_name}</p>
                        <p className="text-xs text-slate-400">{s.role || s.department || 'Staff'}</p>
                      </div>
                      {String(form.sales_executive_id) === String(s.id) && <CheckCircle size={16} className="text-indigo-400 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Staff ID (Optional)</label>
                <input value={form.sales_executive_id} onChange={e => update('sales_executive_id', e.target.value)}
                  type="number" placeholder="Leave blank for Round-Robin auto-assign"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
            )}
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs text-indigo-300">
              💡 If left blank, the system uses sequential Round-Robin to balance workload.
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white">Step 5 — Tour Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date <span className="text-red-400">*</span></label>
                <input type="date" value={form.scheduled_date} onChange={e => update('scheduled_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Time Slot</label>
                <input type="time" value={form.scheduled_time} onChange={e => update('scheduled_time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Duration (minutes)</label>
                <select value={form.expected_duration} onChange={e => update('expected_duration', Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm">
                  {[30, 45, 60, 90, 120, 180].map(d => (
                    <option key={d} value={d}>{d} min {d >= 60 ? `(${d/60}h)` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Priority</label>
                <select value={form.priority} onChange={e => update('priority', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm">
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Visit Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'physical', label: '🏢 Physical', desc: 'On-site tour' },
                  { val: 'virtual', label: '📱 Virtual', desc: 'Video walkthrough' },
                  { val: 'self_guided', label: '🗺️ Self-Guided', desc: 'Independent visit' },
                ].map(vt => (
                  <button key={vt.val} type="button" onClick={() => update('visit_type', vt.val)}
                    className={form.visit_type === vt.val ? selectedCardClass : normalCardClass}>
                    <p className="text-sm font-bold text-white">{vt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{vt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Purpose</label>
              <select value={form.purpose} onChange={e => update('purpose', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500 text-sm">
                <option value="property_viewing">Property Viewing</option>
                <option value="investor_visit">Investor Visit</option>
                <option value="final_inspection">Final Inspection</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Internal Notes</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                rows={3} placeholder="Any internal notes for the sales team..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none" />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white">Step 6 — Transport Service</h2>
            <div
              onClick={() => update('transport_required', !form.transport_required)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${form.transport_required ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/20 hover:border-slate-600'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.transport_required ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                  {form.transport_required && <CheckCircle size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Request Cab / Transport Service</p>
                  <p className="text-xs text-slate-400">Customer requires pickup and drop service</p>
                </div>
                <Navigation size={18} className={`ml-auto ${form.transport_required ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
            </div>
            {form.transport_required && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pickup Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={form.pickup_location} onChange={e => update('pickup_location', e.target.value)}
                      placeholder="Station, airport, home address..."
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Drop Destination</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-emerald-400" />
                    <input value={form.drop_location} onChange={e => update('drop_location', e.target.value)}
                      placeholder="Property site or home address..."
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white">Step 7 — Review & Confirm</h2>
            <div className="rounded-xl border border-slate-700/40 overflow-hidden">
              {[
                { label: 'Property', value: selectedProperty ? `${selectedProperty.title || selectedProperty.name} (ID: ${selectedProperty.id})` : form.property_id || '—', icon: Home },
                { label: 'Customer', value: selectedCustomer ? (selectedCustomer.full_name || selectedCustomer.name) : form.customer_id || 'Draft (unassigned)', icon: User },
                { label: 'Linked Lead', value: selectedLead ? `#${selectedLead.id} - ${selectedLead.full_name || selectedLead.name || 'Lead'}` : form.lead_id || '—', icon: Star },
                { label: 'Builder', value: selectedBuilder ? (selectedBuilder.name || selectedBuilder.company_name) : form.builder_id ? `ID: ${form.builder_id}` : 'Auto-resolve', icon: HardHat },
                { label: 'Sales Rep', value: selectedStaff ? `${selectedStaff.first_name || ''} ${selectedStaff.last_name || ''}`.trim() || selectedStaff.full_name : form.sales_executive_id ? `ID: ${form.sales_executive_id}` : 'Round-Robin Auto', icon: Users },
                { label: 'Date & Time', value: form.scheduled_date ? `${form.scheduled_date} at ${form.scheduled_time}` : '—', icon: Calendar },
                { label: 'Duration', value: `${form.expected_duration} minutes`, icon: Clock },
                { label: 'Visit Type', value: form.visit_type.replace('_', ' ').toUpperCase(), icon: Navigation },
                { label: 'Priority', value: form.priority.toUpperCase(), icon: AlertCircle },
                { label: 'Transport', value: form.transport_required ? `Yes — ${form.pickup_location} → ${form.drop_location}` : 'Not Required', icon: Navigation },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0">
                  <row.icon size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400 w-28 flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-white font-semibold truncate">{row.value}</span>
                </div>
              ))}
            </div>
            {!form.property_id && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                <AlertCircle size={14} /> Property ID is required. Please go back to Step 2.
              </div>
            )}
            {!form.scheduled_date && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
                <AlertCircle size={14} /> Please select a scheduled date in Step 5.
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col items-center justify-center py-10 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/30 animate-pulse">
                <CheckCircle size={44} className="text-emerald-400" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white">Site Visit Dispatched!</h2>
              <p className="text-slate-400 text-sm">Visit Pass successfully created</p>
              <p className="text-3xl font-mono font-bold text-indigo-400 mt-3">{created?.visit_number || 'SV-DRAFT'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-center w-full max-w-xs">
              {[
                { label: 'Status', value: created?.status || 'Scheduled', color: 'text-emerald-400' },
                { label: 'Priority', value: form.priority.toUpperCase(), color: 'text-amber-400' },
                { label: 'Type', value: form.visit_type.replace('_', ' '), color: 'text-indigo-400' },
                { label: 'Duration', value: `${form.expected_duration}min`, color: 'text-violet-400' },
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
                  <p className="text-slate-400">{stat.label}</p>
                  <p className={`font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {created?.id && (
                <button onClick={() => navigate(`/admin/site-visits/${created.id}`)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all text-sm">
                  View Visit Pass
                </button>
              )}
              <button onClick={() => navigate('/admin/site-visits')}
                className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm">
                All Site Visits
              </button>
              <button onClick={() => { setStep(1); setForm({ customer_id: '', lead_id: '', property_id: '', builder_id: '', sales_executive_id: '', visit_type: 'physical', scheduled_date: '', scheduled_time: '10:00', expected_duration: 60, transport_required: false, pickup_location: '', drop_location: '', notes: '', priority: 'medium', purpose: 'property_viewing' }); setCreated(null); }}
                className="px-6 py-2.5 rounded-xl border border-indigo-700 text-indigo-300 hover:text-white transition-all text-sm">
                + New Visit
              </button>
            </div>
          </div>
        );
    }
  };

  const canProceed = () => {
    if (step === 2 && !form.property_id) return false;
    if (step === 5 && !form.scheduled_date) return false;
    return true;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">New Site Visit Pass</h1>
          <p className="text-slate-400 text-sm">Guided setup for property viewings and schedule coordination</p>
        </div>
        {loadingData && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg">
            <div className="w-3 h-3 border border-slate-400 border-t-indigo-400 rounded-full animate-spin" />
            Loading data...
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-8">
        {STEPS.map((s, idx) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <button onClick={() => done && setStep(s.id)} className={`flex flex-col items-center min-w-16 ${done ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  done ? 'bg-indigo-500 border-indigo-500 text-white' : active ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-900/30 text-slate-500'
                }`}>
                  {done ? <CheckCircle size={14} /> : <s.icon size={12} />}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 ${active ? 'text-indigo-400' : done ? 'text-slate-300' : 'text-slate-500'}`}>{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 min-w-4 mb-4 ${done ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-700/50 p-6 mb-6" style={{ background: 'var(--bg-card, rgb(15 15 25 / 0.8))' }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      {step < 8 && (
        <div className="flex justify-between">
          <button disabled={step === 1} onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-40 transition-all text-sm">
            <ChevronLeft size={16} /> Back
          </button>
          {step === 7 ? (
            <button disabled={saving || !form.property_id || !form.scheduled_date} onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-40 transition-all text-sm">
              <Save size={16} />
              {saving ? 'Creating...' : 'Issue Visit Pass'}
            </button>
          ) : (
            <button onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-all text-sm">
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
