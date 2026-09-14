import React, { useState } from 'react';
import { PropertyDetail } from '../../types/property';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../contexts/ToastContext';
import { apiClient } from '../../api/axios';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  MapPin, 
  Building2,
  ShieldCheck
} from 'lucide-react';

interface SiteVisitModalProps {
  property: PropertyDetail;
  onClose: () => void;
}

export const SiteVisitModal: React.FC<SiteVisitModalProps> = ({ property, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedVisit, setConfirmedVisit] = useState<{ id: number; visit_number: string; visit_date: string; time_slot: string } | null>(null);

  // Tomorrow's date default
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const userFullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const [guestName, setGuestName] = useState<string>(userFullName);
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>(user?.email || '');
  const [visitDate, setVisitDate] = useState<string>(tomorrow);
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [visitorCount, setVisitorCount] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<string>('Phone Call');

  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
  ];

  const contactModes = ['Phone Call', 'WhatsApp', 'Email'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) {
      toast.error('Please select a visit date');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to schedule a site visit');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = `Visitors: ${visitorCount} | Preferred Contact: ${preferredContact}${notes ? ` | Notes: ${notes}` : ''}`;
      
      const payload = {
        property_id: property.id,
        visit_date: visitDate,
        time_slot: timeSlot,
        notes: combinedNotes,
      };

      const res = await apiClient.post(`/site-visits`, payload);
      setConfirmedVisit({
        id: res.data.visit_id,
        visit_number: res.data.visit_number,
        visit_date: visitDate,
        time_slot: timeSlot,
      });
      toast.success('Site visit scheduled successfully! Check your dashboard for details.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to schedule site visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div className="bg-card text-text-primary w-full max-w-lg rounded-3xl shadow-hover border border-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-secondary/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/15 text-primary rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Schedule Private Site Visit</h3>
              <p className="text-xs text-text-secondary">VIP guided tour with dedicated relationship officer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {confirmedVisit ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-1">Visit #{confirmedVisit.visit_number}</span>
                <h4 className="font-heading font-bold text-2xl text-text-primary">Site Visit Confirmed!</h4>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Your appointment for <span className="font-bold text-text-primary">{property.name}</span> has been saved.
                </p>
              </div>

              <div className="p-4 bg-surface rounded-2xl border border-border text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Scheduled Date:</span>
                  <span className="font-bold text-text-primary">{new Date(confirmedVisit.visit_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Time Slot:</span>
                  <span className="font-bold text-text-primary">{confirmedVisit.time_slot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Location:</span>
                  <span className="font-bold text-text-primary">{property.locality}, {property.city?.name}</span>
                </div>
              </div>

              <button onClick={onClose} className="btn btn-primary w-full max-w-sm mx-auto justify-center">
                Done & Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Property Card Brief */}
              <div className="p-3 bg-surface rounded-2xl border border-border flex items-center gap-3">
                <img
                  src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80'}
                  alt={property.name}
                  className="w-14 h-14 object-cover rounded-xl shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-xs text-text-primary truncate">{property.name}</h4>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    {property.locality}, {property.city?.name}
                  </p>
                </div>
              </div>

              {/* Visitor Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface-secondary/50 rounded-2xl border border-border">
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider block mb-1">
                    Your Contact Coordinates
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="rahul.sharma@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Select Preferred Visit Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="input text-xs"
                  required
                />
              </div>

              {/* Time Slot Picker */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  Select Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                        timeSlot === slot
                          ? 'border-primary bg-primary-50 dark:bg-primary/15 text-primary font-bold shadow-xs'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visitor Count & Preferred Contact Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    Visitor Count
                  </label>
                  <select
                    value={visitorCount}
                    onChange={(e) => setVisitorCount(Number(e.target.value))}
                    className="input text-xs"
                  >
                    <option value={1}>1 Visitor</option>
                    <option value={2}>2 Visitors</option>
                    <option value={3}>3 Visitors</option>
                    <option value={4}>4+ Visitors (Family Group)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-primary" />
                    Preferred Contact
                  </label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    className="input text-xs"
                  >
                    {contactModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Instructions / Message */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Special Message / Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Pickup request, specific floor preference..."
                  className="input text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full btn-lg justify-center gap-2"
                >
                  {isSubmitting ? 'Scheduling Visit...' : 'Confirm & Generate Booking ID'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-text-secondary pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Free Pick & Drop Assistance Available</span>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
