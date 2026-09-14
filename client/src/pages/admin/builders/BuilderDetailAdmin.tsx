import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApiClient } from '../../../api/admin-auth.api';
import {
  HardHat,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Edit,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Users,
  Shield,
  Clock,
} from 'lucide-react';

export const BuilderDetailAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [builder, setBuilder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'documents' | 'projects' | 'properties'>('overview');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminApiClient.get(`/admin/builders/${id}`);
      if (res.data) setBuilder(res.data);
    } catch (err) {
      console.error('Error fetching builder admin detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleVerifyToggle = async () => {
    if (!builder) return;
    try {
      const endpoint = builder.verification_status === 'verified' ? 'reject' : 'verify';
      await adminApiClient.patch(`/admin/builders/${id}/${endpoint}`, {});
      fetchDetail();
    } catch (err) {
      console.error('Toggle verify error:', err);
    }
  };

  if (loading || !builder) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p>Loading builder profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/builders')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={builder.logo_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80'}
              alt={builder.company_name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-extrabold text-white">{builder.company_name || builder.name}</h1>
                {builder.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified Developer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                RERA: {builder.rera_number || 'P519000001'} | Est. {builder.established_year || 1995}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyToggle}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              builder.verification_status === 'verified'
                ? 'bg-rose-950 text-rose-300 border-rose-800/50 hover:bg-rose-900'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900'
            }`}
          >
            {builder.verification_status === 'verified' ? 'Revoke Verification' : 'Approve & Verify'}
          </button>
          <button
            onClick={() => navigate(`/admin/builders/edit/${id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-600"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {(['overview', 'contacts', 'documents', 'projects', 'properties'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">About {builder.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {builder.description || 'Premier real estate developer committed to architectural innovation and timely delivery.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Registration & Tax Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Registration Number:</span>
                  <span className="text-white font-mono font-semibold">{builder.registration_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">RERA Number:</span>
                  <span className="text-white font-mono font-semibold">{builder.rera_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">GST Number:</span>
                  <span className="text-white font-mono font-semibold">{builder.gst_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Company PAN:</span>
                  <span className="text-white font-mono font-semibold">{builder.pan_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Contact & HQ</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-primary" /> {builder.email || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-primary" /> {builder.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="w-4 h-4 text-primary" /> {builder.website || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-primary" /> {builder.city}, {builder.state}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Executive Contacts</h3>
          <div className="space-y-2 text-xs">
            {builder.contacts?.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between">
                <div>
                  <p className="font-semibold text-white">{c.name} ({c.designation})</p>
                  <p className="text-[10px] text-slate-400">{c.email} | {c.phone}</p>
                </div>
                {c.is_primary && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">Primary</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Document Vault</h3>
          <div className="space-y-2 text-xs">
            {builder.documents?.map((d: any) => (
              <div key={d.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between">
                <span className="font-semibold text-white">{d.document_type}</span>
                <span className="text-[10px] text-emerald-400 font-bold">{d.verification_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Associated Properties</h3>
          <div className="space-y-2 text-xs">
            {builder.associated_properties?.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between">
                <span className="font-semibold text-white">{p.name} ({p.locality})</span>
                <span className="text-primary font-bold">₹{(p.price / 10000000).toFixed(2)} Cr</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
