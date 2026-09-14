import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../api/axios';
import { toast } from '../../../contexts/ToastContext';
import {
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Plus,
  Save,
  Eye,
  FileText,
  DollarSign,
  Layers,
  MapPin,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const PropertyWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State across all 8 steps
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    purpose: 'Sale',
    property_type: 'apartment',
    status: 'available',
    rera_number: 'P51900028491',
    possession_date: 'Ready to Move',
    facing: 'East',
    furnishing: 'Semi-Furnished',
    ownership: 'Freehold',
    property_age: 'New Construction',
    builder_id: 1,
    city_id: 1,
    locality: 'Bandra West',
    full_address: 'Plot 42, Executive Skyline Avenue, Bandra West',
    country: 'India',
    state: 'Maharashtra',
    pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,

    // Step 2: Specs
    bhk: 3,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    floor_number: 12,
    total_floors: 24,
    carpet_area: 1250,
    builtup_area: 1500,
    super_builtup_area: 1850,
    area_sqft: 1500,

    // Step 3: Pricing
    price: 25000000,
    offer_price: 23500000,
    maintenance_monthly: 6500,
    booking_amount: 1000000,
    estimated_emi: 145000,

    // Step 4: Amenities
    selectedAmenities: ['Swimming Pool', 'Gym', 'Club House', '24x7 Security', 'Power Backup', 'Elevator', 'Car Parking'],

    // Step 5: Gallery
    images: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80', caption: 'Exterior View', is_primary: true },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=80', caption: 'Living Room', is_primary: false },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80', caption: 'Master Bedroom', is_primary: false },
    ],

    // Step 6: Documents
    documents: [
      { title: 'RERA Certificate', file_url: '#', category: 'legal' },
      { title: 'E-Brochure PDF', file_url: '#', category: 'brochure' },
    ],

    // Step 7: Nearby Locations
    nearbyPlaces: [
      { category: 'School', name: 'Delhi Public School', distance: '1.2 km' },
      { category: 'Hospital', name: 'Apollo Speciality Hospital', distance: '2.5 km' },
      { category: 'Metro', name: 'City Center Metro Line 1', distance: '0.8 km' },
    ],

    is_published: true,
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      apiClient
        .get(`/admin/properties/${id}`)
        .then((res) => {
          if (res.data) {
            setFormData((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch((err) => console.error('Error fetching property detail:', err))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) {
      toast.error('Please paste a valid image URL first.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: trimmed, caption: newImageCaption.trim() || 'Property Photo', is_primary: prev.images.length === 0 },
      ],
    }));
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const removeImage = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const setPrimaryImage = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_primary: i === idx })),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await apiClient.put(`/admin/properties/${id}`, formData);
        toast.success('Property updated successfully!');
      } else {
        await apiClient.post('/admin/properties', formData);
        toast.success('Property listed & published successfully!');
      }
      navigate('/admin/properties');
    } catch (err: any) {
      console.error('Submit property wizard failed:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to publish property');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Specifications' },
    { number: 3, title: 'Pricing' },
    { number: 4, title: 'Amenities' },
    { number: 5, title: 'Gallery' },
    { number: 6, title: 'Documents' },
    { number: 7, title: 'Nearby Places' },
    { number: 8, title: 'Preview & Publish' },
  ];

  const amenityOptions = [
    'Swimming Pool', 'Gym', 'Club House', '24x7 Security', 'Power Backup',
    'Elevator', 'Car Parking', 'Landscaped Garden', 'Children Play Area',
    'Jogging Track', 'WiFi Connectivity', 'Intercom Facility', 'Fire Safety'
  ];

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading property configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1120] via-slate-900 to-[#0B1120] rounded-2xl border border-slate-800/80 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
              {isEdit ? '✎ Edit Mode' : '+ Property Wizard'}
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white mt-0.5">
              {isEdit ? 'Edit Property Listing' : 'Add New Property Listing'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Step <span className="text-white font-bold">{currentStep}</span> of 8 —{' '}
              <span className="text-emerald-400 font-semibold">{steps[currentStep - 1].title}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/properties')}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            Cancel & Exit
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative mt-4">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#0B1120] border border-slate-800/60 rounded-2xl p-3">
        {steps.map((s) => (
          <button
            key={s.number}
            onClick={() => setCurrentStep(s.number)}
            className={`p-2.5 rounded-xl text-left transition-all duration-200 ${
              currentStep === s.number
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20'
                : currentStep > s.number
                ? 'bg-slate-800/80 text-emerald-400 font-semibold border border-emerald-800/30'
                : 'bg-slate-900/50 text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-60 font-mono">0{s.number}</span>
              {currentStep > s.number && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <p className="text-[11px] truncate mt-0.5 font-medium">{s.title}</p>
          </button>
        ))}
      </div>

      {/* Step Content Card */}
      <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Basic Property Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Property Title *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Oberoi Sky City 3BHK Penthouse"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Property Type</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => updateField('property_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                >
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="commercial">Commercial</option>
                  <option value="plot">Plot</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Listing Purpose</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                >
                  <option value="Sale">For Sale</option>
                  <option value="Rent">For Rent</option>
                  <option value="Lease">Lease</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">RERA Number</label>
                <input
                  type="text"
                  value={formData.rera_number}
                  onChange={(e) => updateField('rera_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Locality / Area</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => updateField('locality', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Possession Date</label>
                <input
                  type="text"
                  value={formData.possession_date}
                  onChange={(e) => updateField('possession_date', e.target.value)}
                  placeholder="e.g. Dec 2026 or Ready to Move"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Comprehensive description of the architectural features, view, and luxury specifications..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Specifications */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Property Specs & Floor Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">BHK Configuration</label>
                <input
                  type="number"
                  value={formData.bhk}
                  onChange={(e) => updateField('bhk', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => updateField('bedrooms', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => updateField('bathrooms', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Built-up Area (Sq.Ft)</label>
                <input
                  type="number"
                  value={formData.builtup_area}
                  onChange={(e) => updateField('builtup_area', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Carpet Area (Sq.Ft)</label>
                <input
                  type="number"
                  value={formData.carpet_area}
                  onChange={(e) => updateField('carpet_area', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Super Built-up Area (Sq.Ft)</label>
                <input
                  type="number"
                  value={formData.super_builtup_area}
                  onChange={(e) => updateField('super_builtup_area', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Pricing & Financial Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Total Price (₹ INR) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm"
                />
                <p className="text-[10px] text-primary mt-1">₹{(formData.price / 10000000).toFixed(2)} Crores</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Offer / Discount Price (₹ INR)</label>
                <input
                  type="number"
                  value={formData.offer_price}
                  onChange={(e) => updateField('offer_price', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Monthly Maintenance (₹)</label>
                <input
                  type="number"
                  value={formData.maintenance_monthly}
                  onChange={(e) => updateField('maintenance_monthly', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Booking Amount (Token)</label>
                <input
                  type="number"
                  value={formData.booking_amount}
                  onChange={(e) => updateField('booking_amount', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Amenities */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Select Amenities & Lifestyle Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityOptions.map((item) => {
                const isChecked = formData.selectedAmenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        updateField('selectedAmenities', formData.selectedAmenities.filter((a) => a !== item));
                      } else {
                        updateField('selectedAmenities', [...formData.selectedAmenities, item]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs text-left font-semibold flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{item}</span>
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Gallery */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
              Image Gallery & Thumbnail Selection
            </h3>

            {/* URL input row */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Image URL (Unsplash or CDN)..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Caption (e.g. Living Room)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  className="w-40 px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="btn btn-primary btn-sm px-5 whitespace-nowrap"
                >
                  + Add Image
                </button>
              </div>
              <p className="text-[10px] text-text-muted">Press Enter or click Add Image. First image is set as Primary automatically.</p>
            </div>

            {formData.images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border text-text-muted space-y-2">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <p className="text-xs">No images added yet. Paste an image URL above.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative group bg-surface rounded-xl overflow-hidden border border-border shadow-soft">
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=60';
                    }}
                  />
                  <div className="p-2 flex items-center justify-between bg-card/95 text-xs border-t border-border">
                    <span className="text-[10px] text-text-secondary truncate max-w-[100px]">{img.caption}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                          img.is_primary
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-surface-secondary text-text-muted border border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {img.is_primary ? 'Primary' : 'Set Primary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="text-rose-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Documents */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Legal Documents & Brochures
            </h3>
            <div className="space-y-2">
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-white">{doc.title}</span>
                  </div>
                  <span className="text-[10px] uppercase text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{doc.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Nearby Places */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Nearby Infrastructure & Connectivity
            </h3>
            <div className="space-y-2">
              {formData.nearbyPlaces.map((np, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <span className="font-semibold text-white">{np.name} ({np.category})</span>
                  <span className="text-primary font-bold">{np.distance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Preview & Publish */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Final Verification & Publish Confirmation
            </h3>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Ready for Publication</span>
                  <h4 className="text-lg font-bold text-white font-heading mt-0.5">{formData.name || 'Untitled Property'}</h4>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold rounded-full font-mono">
                  ₹{(formData.price / 10000000).toFixed(2)} Cr
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Specifications</p>
                  <p className="text-white font-bold">{formData.bhk} BHK • {formData.bedrooms} Beds • {formData.bathrooms} Baths</p>
                  <p className="text-slate-300">Carpet Area: <span className="text-white font-bold">{formData.carpet_area} Sq.Ft</span></p>
                  <p className="text-slate-300">Builtup Area: <span className="text-white font-bold">{formData.builtup_area} Sq.Ft</span></p>
                </div>

                <div className="space-y-2 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Location & Address</p>
                  <p className="text-white font-bold">{formData.locality || 'Prime Locality'}</p>
                  <p className="text-slate-300">{formData.full_address || 'Address pending'}</p>
                  <p className="text-indigo-400 font-mono">RERA: {formData.rera_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800/80">
                <span className="text-slate-400">Gallery Photos: <strong className="text-white font-bold">{formData.images.length} uploaded</strong></span>
                <span className="text-slate-400">Legal Documents: <strong className="text-white font-bold">{formData.documents.length} attached</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer Controls */}
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

          {currentStep < 8 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(8, s + 1))}
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
              {submitting ? 'Publishing...' : 'Save & Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
