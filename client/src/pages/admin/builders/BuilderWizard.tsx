import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApiClient } from '../../../api/admin-auth.api';
import {
  HardHat,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Building2,
  FileText,
  Users,
} from 'lucide-react';

export const BuilderWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    established_year: 2005,
    company_type: 'Private Limited',
    website: '',
    email: '',
    phone: '',
    alternate_phone: '',
    headquarters: '',
    total_projects: 15,
    delivered_projects: 12,
    rating: 4.5,
    registration_number: '',
    rera_number: '',
    pan_number: '',
    gst_number: '',
    description: '',
    logo_url: '',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '',
    pincode: '400001',
    contacts: [
      { name: 'Rajesh Sharma', designation: 'Sales VP', email: 'rajesh@godrej.com', phone: '+91 98765 43210' },
    ],
    documents: [
      { document_type: 'RERA Certificate', document_name: 'rera_cert.pdf', document_url: 'https://example.com/doc.pdf' },
    ],
    projects: [
      { project_name: 'Godrej Reserve', location: 'Kandivali East', status: 'Ongoing' },
    ],
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      adminApiClient
        .get(`/admin/builders/${id}`)
        .then((res) => {
          if (res.data) setFormData((prev) => ({ ...prev, ...res.data }));
        })
        .catch((err) => console.error('Error fetching builder detail:', err))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await adminApiClient.put(`/admin/builders/${id}`, formData);
      } else {
        await adminApiClient.post('/admin/builders', formData);
      }
      navigate('/admin/builders');
    } catch (err) {
      console.error('Submit builder wizard failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Company Info' },
    { number: 2, title: 'Registration' },
    { number: 3, title: 'Location' },
    { number: 4, title: 'Contacts' },
    { number: 5, title: 'Documents' },
    { number: 6, title: 'Projects' },
    { number: 7, title: 'Preview' },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p>Loading builder profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            {isEdit ? 'Edit Builder Profile' : 'Onboard Builder Wizard'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {currentStep} of 7 — {steps[currentStep - 1].title}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/builders')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white"
        >
          Cancel & Exit
        </button>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        {steps.map((s) => (
          <button
            key={s.number}
            onClick={() => setCurrentStep(s.number)}
            className={`p-2 rounded-xl text-left transition-all ${
              currentStep === s.number
                ? 'bg-primary text-white font-bold shadow-glow-primary'
                : currentStep > s.number
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'bg-slate-950/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-70">0{s.number}</span>
              {currentStep > s.number && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <p className="text-[11px] truncate mt-0.5">{s.title}</p>
          </button>
        ))}
      </div>

      {/* Content Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* STEP 1: Company Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Company General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Godrej Properties Ltd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company Logo URL</label>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Company Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Premier real estate developer known for sustainable luxury townships..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Registration Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Registration & Legal Tax Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">RERA Number *</label>
                <input
                  type="text"
                  value={formData.rera_number}
                  onChange={(e) => updateField('rera_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company Registration Number</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => updateField('registration_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => updateField('gst_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company PAN</label>
                <input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => updateField('pan_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Established Year</label>
                <input
                  type="number"
                  value={formData.established_year}
                  onChange={(e) => updateField('established_year', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Corporate Headquarters Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Headquarters Full Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Contacts */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Key Executive Contact Persons
            </h3>
            <div className="space-y-3">
              {formData.contacts.map((c, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-1">
                  <p className="font-semibold text-white">{c.name} ({c.designation})</p>
                  <p className="text-[10px] text-slate-400">{c.email} | {c.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Documents */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Compliance Document Vault
            </h3>
            <div className="space-y-2 text-xs">
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <span className="font-semibold text-white">{doc.document_type}</span>
                  <span className="text-[10px] text-slate-400">{doc.document_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Projects */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Builder Projects Portfolio
            </h3>
            <div className="space-y-2 text-xs">
              {formData.projects.map((proj, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <span className="font-semibold text-white">{proj.project_name} ({proj.location})</span>
                  <span className="text-emerald-400 font-bold">{proj.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Preview */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Review & Submit Builder Onboarding
            </h3>
            <div className="bg-slate-950 p-4 rounded-xl space-y-2 text-xs">
              <p><strong className="text-slate-400">Company Name:</strong> {formData.name}</p>
              <p><strong className="text-slate-400">RERA Number:</strong> {formData.rera_number}</p>
              <p><strong className="text-slate-400">Official Email:</strong> {formData.email}</p>
              <p><strong className="text-slate-400">Location:</strong> {formData.city}, {formData.state}</p>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-600"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-glow-primary hover:bg-emerald-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Save & Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
