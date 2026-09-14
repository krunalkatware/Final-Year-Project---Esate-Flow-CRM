import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Home, DollarSign, Tag, Percent, CreditCard, FileText,
  CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Save,
  Building2, IndianRupee, Hash, Calendar
} from 'lucide-react';
import { adminBookingsApi } from '../../../api/admin-bookings.api';

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Property', icon: Home },
  { id: 3, label: 'Pricing', icon: IndianRupee },
  { id: 4, label: 'Discount', icon: Tag },
  { id: 5, label: 'Taxes', icon: Percent },
  { id: 6, label: 'Payments', icon: CreditCard },
  { id: 7, label: 'Documents', icon: FileText },
  { id: 8, label: 'Agreement', icon: FileText },
  { id: 9, label: 'Review', icon: CheckCircle },
  { id: 10, label: 'Confirm', icon: CheckCircle },
];

function StepIndicator({ current, steps }: { current: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className={`flex flex-col items-center gap-1 min-w-[52px] group`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done ? 'bg-indigo-500 border-indigo-500' :
                active ? 'bg-indigo-500/20 border-indigo-500' :
                'bg-slate-800 border-slate-600'
              }`}>
                {done ? <CheckCircle size={16} className="text-white" /> :
                  <step.icon size={14} className={active ? 'text-indigo-400' : 'text-slate-500'} />}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-indigo-400' : done ? 'text-slate-300' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-16px] mb-6 transition-all ${done ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function BookingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const [form, setForm] = useState({
    customer_id: '',
    property_id: '',
    builder_id: '',
    lead_id: '',
    unit_number: '',
    floor_number: 1,
    bhk_type: '3 BHK',
    super_builtup_area: 1450,
    carpet_area: 1100,
    base_price: 0,
    discount_amount: 0,
    discount_reason: '',
    token_amount: 100000,
    floor_rise_charges: 0,
    plc_charges: 0,
    parking_charges: 0,
    club_membership_charges: 0,
    other_charges: 0,
    gst_percent: 5,
    payment_mode: 'net_banking',
    notes: '',
  });

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const gross = form.base_price + form.floor_rise_charges + form.plc_charges + form.parking_charges + form.club_membership_charges + form.other_charges;
  const taxable = Math.max(0, gross - form.discount_amount);
  const gst = taxable * (form.gst_percent / 100);
  const stamDuty = taxable * 0.05;
  const registration = 30000;
  const netTotal = taxable + gst + stamDuty + registration;

  const handleSubmit = async () => {
    if (!form.property_id) {
      alert('Property ID is required');
      return;
    }
    setSaving(true);
    try {
      const result = await adminBookingsApi.createBooking({
        ...form,
        property_id: Number(form.property_id),
        builder_id: form.builder_id ? Number(form.builder_id) : undefined,
        lead_id: form.lead_id ? Number(form.lead_id) : undefined,
        floor_number: Number(form.floor_number),
        super_builtup_area: Number(form.super_builtup_area),
        carpet_area: Number(form.carpet_area),
        base_price: Number(form.base_price),
        discount_amount: Number(form.discount_amount),
        token_amount: Number(form.token_amount),
        floor_rise_charges: Number(form.floor_rise_charges),
        plc_charges: Number(form.plc_charges),
        parking_charges: Number(form.parking_charges),
        club_membership_charges: Number(form.club_membership_charges),
        other_charges: Number(form.other_charges),
      });
      setCreated(result);
      setStep(10);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input type={type} value={(form as any)[name]} onChange={e => update(name, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all" />
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 1 — Customer Information</h2>
          <p className="text-sm text-slate-400">Link this booking to an existing customer account.</p>
          <Field label="Customer User ID" name="customer_id" placeholder="e.g. uuid-of-customer" />
          <Field label="Lead ID (optional)" name="lead_id" type="number" placeholder="e.g. 12" />
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            💡 Leave Customer ID empty to create an unlinked draft. You can assign later.
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 2 — Property & Unit</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property ID *" name="property_id" type="number" placeholder="e.g. 1" />
            <Field label="Builder ID" name="builder_id" type="number" placeholder="e.g. 1" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Unit Number" name="unit_number" placeholder="e.g. 1001-A" />
            <Field label="Floor Number" name="floor_number" type="number" placeholder="e.g. 10" />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">BHK Type</label>
              <select value={form.bhk_type} onChange={e => update('bhk_type', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500">
                {['1 BHK','2 BHK','3 BHK','4 BHK','5 BHK','Penthouse'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Super Builtup Area (sq.ft)" name="super_builtup_area" type="number" />
            <Field label="Carpet Area (sq.ft)" name="carpet_area" type="number" />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 3 — Pricing Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base Price (₹) *" name="base_price" type="number" />
            <Field label="Token Amount (₹)" name="token_amount" type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Floor Rise Charges (₹)" name="floor_rise_charges" type="number" />
            <Field label="PLC Charges (₹)" name="plc_charges" type="number" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Parking Charges (₹)" name="parking_charges" type="number" />
            <Field label="Club Membership (₹)" name="club_membership_charges" type="number" />
            <Field label="Other Charges (₹)" name="other_charges" type="number" />
          </div>
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30">
            <div className="text-sm font-medium text-slate-300 mb-2">Gross Total Preview</div>
            <div className="text-2xl font-bold text-white">₹{gross.toLocaleString('en-IN')}</div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 4 — Discount</h2>
          <Field label="Discount Amount (₹)" name="discount_amount" type="number" />
          <Field label="Discount Reason" name="discount_reason" placeholder="e.g. Early Bird Offer" />
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 text-sm">
            <div className="flex justify-between text-slate-400 mb-1"><span>Gross Total</span><span>₹{gross.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-red-400 mb-1"><span>Discount</span><span>-₹{form.discount_amount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-white font-semibold"><span>Taxable Amount</span><span>₹{taxable.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 5 — Taxes & Charges</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">GST Percentage (%)</label>
            <select value={form.gst_percent} onChange={e => update('gst_percent', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500">
              {[5, 12, 18].map(v => <option key={v} value={v}>{v}%</option>)}
            </select>
          </div>
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Taxable Amount</span><span>₹{taxable.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-amber-400"><span>GST ({form.gst_percent}%)</span><span>+₹{gst.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-amber-400"><span>Stamp Duty (5%)</span><span>+₹{stamDuty.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-amber-400"><span>Registration Charges</span><span>+₹{registration.toLocaleString('en-IN')}</span></div>
            <div className="h-px bg-slate-700" />
            <div className="flex justify-between text-white font-bold text-base"><span>Net Total</span><span>₹{netTotal.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 6 — Payment Plan</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Preferred Payment Mode</label>
            <select value={form.payment_mode} onChange={e => update('payment_mode', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:border-indigo-500">
              {['net_banking','upi','cheque','bank_transfer','cash'].map(m => <option key={m}>{m.replace(/_/g,' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 space-y-2">
            <div className="text-sm font-medium text-slate-300 mb-3">Auto-generated Installment Schedule</div>
            {[
              { label: 'Token & Booking (10%)', amount: netTotal * 0.10 },
              { label: 'Foundation Milestone (25%)', amount: netTotal * 0.25 },
              { label: 'Superstructure Milestone (35%)', amount: netTotal * 0.35 },
              { label: 'Possession & Handover (30%)', amount: netTotal * 0.30 },
            ].map((inst, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-sm text-slate-300">{inst.label}</span>
                <span className="text-sm font-semibold text-white">₹{inst.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 7 — Documents</h2>
          <p className="text-sm text-slate-400">Document uploads are available after booking creation in the Detail view.</p>
          <div className="grid grid-cols-2 gap-3">
            {['Sale Agreement','Booking Form','Customer KYC','PAN Card','Aadhaar','Loan Documents','Receipts','Invoices'].map((doc) => (
              <div key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
                <FileText size={16} className="text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-400">{doc}</span>
                <span className="ml-auto text-xs text-amber-400">Pending</span>
              </div>
            ))}
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 8 — Agreement</h2>
          <p className="text-sm text-slate-400">A digital booking agreement will be auto-generated after approval.</p>
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium"><CheckCircle size={16} /> Digital signature ready</div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium"><CheckCircle size={16} /> PDF generation enabled</div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium"><CheckCircle size={16} /> Agreement history tracking enabled</div>
          </div>
          <Field label="Additional Notes" name="notes" placeholder="Any special terms or conditions..." />
        </div>
      );
      case 9: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Step 9 — Review Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Property ID', value: form.property_id || '—' },
              { label: 'Unit', value: form.unit_number || '—' },
              { label: 'Floor', value: form.floor_number },
              { label: 'BHK Type', value: form.bhk_type },
              { label: 'Base Price', value: `₹${Number(form.base_price).toLocaleString('en-IN')}` },
              { label: 'Discount', value: `₹${form.discount_amount.toLocaleString('en-IN')}` },
              { label: 'GST', value: `${form.gst_percent}%` },
              { label: 'Net Total', value: `₹${netTotal.toLocaleString('en-IN')}` },
              { label: 'Token Amount', value: `₹${Number(form.token_amount).toLocaleString('en-IN')}` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0 text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-white font-medium">{row.value}</span>
              </div>
            ))}
          </div>
          {!form.property_id && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle size={16} /> Property ID is required before submitting
            </div>
          )}
        </div>
      );
      case 10: return (
        <div className="flex flex-col items-center justify-center py-10 gap-6">
          {created ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Booking Created!</h2>
                <p className="text-slate-400 mb-1">Booking Number</p>
                <p className="text-xl font-mono font-bold text-indigo-400">{created.booking_number}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate(`/admin/bookings/${created.id}`)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all">
                  View Booking Details
                </button>
                <button onClick={() => { setStep(1); setForm({ ...form, property_id: '', unit_number: '' }); setCreated(null); }}
                  className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white transition-all">
                  Create Another
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400">Creating booking...</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">New Booking Wizard</h1>
        <p className="text-slate-400 text-sm">Complete all steps to create an enterprise booking</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator current={step} steps={STEPS} />
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-700/50 p-6 mb-6" style={{ background: 'var(--bg-card)' }}>
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      {step < 10 && (
        <div className="flex justify-between">
          <button disabled={step === 1} onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-40 transition-all">
            <ChevronLeft size={16} /> Back
          </button>
          {step === 9 ? (
            <button onClick={handleSubmit} disabled={saving || !form.property_id}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:shadow-lg disabled:opacity-40 transition-all">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Creating...' : 'Create Booking'}
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all">
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
