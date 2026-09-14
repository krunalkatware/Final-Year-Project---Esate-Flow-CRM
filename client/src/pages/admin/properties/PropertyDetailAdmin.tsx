import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApiClient } from '../../../api/admin-auth.api';
import {
  Building,
  CheckCircle2,
  ChevronLeft,
  Edit,
  Trash2,
  Copy,
  Eye,
  Shield,
  Clock,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const PropertyDetailAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminApiClient.get(`/admin/properties/${id}`);
      if (res.data) setProperty(res.data);
    } catch (err) {
      console.error('Error fetching property admin detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const togglePublish = async () => {
    if (!property) return;
    try {
      const endpoint = property.is_published ? 'unpublish' : 'publish';
      await adminApiClient.patch(`/admin/properties/${id}/${endpoint}`, {});
      fetchDetail();
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  };

  if (loading || !property) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p>Loading property details...</p>
      </div>
    );
  }

  const primaryImage =
    property.images?.find((i: any) => i.is_primary)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Back button & Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/properties')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-white">{property.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              RERA: {property.rera_number || 'N/A'} | ID: #{property.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePublish}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              property.is_published
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900'
                : 'bg-amber-950 text-amber-400 border-amber-800/50 hover:bg-amber-900'
            }`}
          >
            {property.is_published ? 'Live & Published' : 'Draft / Unpublished'}
          </button>
          <button
            onClick={() => navigate(`/admin/properties/edit/${id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary hover:bg-primary-600"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Property
          </button>
        </div>
      </div>

      {/* Main Grid: Cover Photo & Spec Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <img src={primaryImage} alt={property.name} className="w-full h-80 object-cover" />
          </div>

          {/* Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white">Description</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {property.description || 'No custom description provided for this property listing.'}
            </p>
          </div>

          {/* Highlights */}
          {property.highlights && property.highlights.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Property Highlights</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {property.highlights.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{h.title}</p>
                      {h.description && <p className="text-[10px] text-slate-400">{h.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Key Specs & Audit Trail */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-slate-400">Total Price</p>
            <p className="text-2xl font-extrabold text-white font-mono">
              ₹{(property.price / 10000000).toFixed(2)} Cr
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">BHK / Bedrooms:</span>
                <span className="text-white font-semibold">{property.bhk || property.bedrooms} BHK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Built-up Area:</span>
                <span className="text-white font-semibold">{property.area_sqft} Sq.Ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Property Type:</span>
                <span className="text-white font-semibold capitalize">{property.property_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold capitalize">{property.status}</span>
              </div>
            </div>
          </div>

          {/* Audit Log Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white">Audit Trail</h3>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                <strong className="text-white">Created By:</strong> {property.created_by || 'Admin System'}
              </p>
              <p className="text-slate-400">
                <strong className="text-white">Created At:</strong> {property.created_at || 'Recently'}
              </p>
              <p className="text-slate-400">
                <strong className="text-white">Published By:</strong> {property.published_by || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
