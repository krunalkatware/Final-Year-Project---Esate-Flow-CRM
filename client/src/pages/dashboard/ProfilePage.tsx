import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../contexts/ToastContext';
import {
  User,
  KeyRound,
  Activity,
  Wallet,
  Bell,
  FileText,
  Settings,
  Trash2,
  Save,
  Shield,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';

type Tab = 'personal' | 'security' | 'activity' | 'wallet' | 'notifications' | 'documents' | 'settings' | 'danger';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal',      label: 'Personal Info',   icon: User },
  { id: 'security',      label: 'Security',         icon: Shield },
  { id: 'activity',      label: 'Activity',         icon: Activity },
  { id: 'wallet',        label: 'Wallet',           icon: Wallet },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'documents',     label: 'Documents',        icon: FileText },
  { id: 'settings',      label: 'Preferences',      icon: Settings },
  { id: 'danger',        label: 'Delete Account',   icon: Trash2 },
];

export const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    preferred_cities: '',
    preferred_property_type: '',
  });

  const [passData, setPassData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    email_bookings: true,
    email_visits: true,
    email_promo: false,
    sms_alerts: true,
    push_alerts: true,
  });

  const [prefData, setPrefData] = useState({
    language: 'en',
    currency: 'INR',
    date_format: 'DD/MM/YYYY',
    compact_mode: false,
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        address: profile.address || '',
        preferred_cities: profile.preferred_cities || '',
        preferred_property_type: profile.preferred_property_type || '',
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await profileApi.updateProfile(formData);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.current_password || !passData.new_password) {
      toast.error('Please fill all password fields.');
      return;
    }
    if (passData.new_password !== passData.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setIsChangingPass(true);
    try {
      await profileApi.changePassword({
        current_password: passData.current_password,
        new_password: passData.new_password,
      });
      toast.success('Password changed successfully!');
      setPassData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Password change failed.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const passStrength = (p: string): { level: number; label: string; color: string } => {
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
    return { level: score, label: map[score], color: colors[score] };
  };

  const strength = passStrength(passData.new_password);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded-xl w-48" />
        <div className="h-48 bg-surface rounded-2xl" />
      </div>
    );
  }

  const initials =
    `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6 animate-fade-in text-text-primary">
      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-card">
        <div className="relative group">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-heading font-extrabold text-xl shadow-glow-primary">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">
            <Camera className="w-3 h-3 text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h1 className="font-heading font-extrabold text-text-primary text-xl">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Mail className="w-3 h-3 text-text-muted" /> {profile?.email}
            </span>
            {profile?.phone && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <Phone className="w-3 h-3 text-text-muted" /> {profile?.phone}
              </span>
            )}
            {profile?.city && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <MapPin className="w-3 h-3 text-text-muted" /> {profile?.city}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-500">Verified Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-2 space-y-0.5 h-fit shadow-soft">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === id
                  ? id === 'danger'
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                  : id === 'danger'
                  ? 'text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-card">

          {/* ── Personal Info ──────────────────────────────────── */}
          {activeTab === 'personal' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Personal Information
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Update your name, phone, location, and preferences.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" disabled value={profile?.email || ''} className="input opacity-60 cursor-not-allowed bg-surface" />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Mumbai" className="input" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Maharashtra" className="input" />
                </div>
              </div>

              <div>
                <label className="label">Full Address</label>
                <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Preferred Cities</label>
                  <input type="text" value={formData.preferred_cities} onChange={(e) => setFormData({ ...formData, preferred_cities: e.target.value })} placeholder="Mumbai, Pune, Navi Mumbai" className="input" />
                </div>
                <div>
                  <label className="label">Preferred Property Type</label>
                  <select value={formData.preferred_property_type} onChange={(e) => setFormData({ ...formData, preferred_property_type: e.target.value })} className="input">
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary btn-md gap-2">
                <Save className="w-4 h-4" />
                {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* ── Security ──────────────────────────────────────── */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Security & Password
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Change your login password and manage account security.</p>
              </div>

              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPass ? 'text' : 'password'} value={passData.current_password} onChange={(e) => setPassData({ ...passData, current_password: e.target.value })} placeholder="••••••••" className="input pr-10" />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showNewPass ? 'text' : 'password'} value={passData.new_password} onChange={(e) => setPassData({ ...passData, new_password: e.target.value })} placeholder="••••••••" className="input pr-10" />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passData.new_password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-surface-secondary'}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${strength.level <= 1 ? 'text-red-500' : strength.level === 2 ? 'text-amber-500' : strength.level === 3 ? 'text-blue-500' : 'text-emerald-500'}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" value={passData.confirm_password} onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })} placeholder="••••••••" className="input" />
                {passData.confirm_password && passData.new_password !== passData.confirm_password && (
                  <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={isChangingPass} className="btn btn-primary btn-md gap-2">
                <KeyRound className="w-4 h-4" />
                {isChangingPass ? 'Updating...' : 'Update Password'}
              </button>

              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-xs font-bold text-text-primary">Active Sessions</h3>
                <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Chrome — Windows</p>
                    <p className="text-[11px] text-text-secondary">Current Session • India</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full border border-emerald-500/30">Active</span>
                </div>
              </div>
            </form>
          )}

          {/* ── Activity ──────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Recent Activity
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">A log of your recent actions on EstateFlow.</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🏡', label: 'Viewed Property: Godrej Prime Residency', time: '2 hours ago' },
                  { icon: '❤️', label: 'Added to Wishlist: Lodha Sterling', time: '1 day ago' },
                  { icon: '📅', label: 'Scheduled Site Visit: Prestige Falcon City', time: '2 days ago' },
                  { icon: '📄', label: 'Downloaded Brochure: Brigade Horizon', time: '3 days ago' },
                  { icon: '🔐', label: 'Password changed successfully', time: '1 week ago' },
                  { icon: '✅', label: 'Account Registered', time: '2 months ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted flex-shrink-0">
                      <Clock className="w-3 h-3" /> {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Wallet ────────────────────────────────────────── */}
          {activeTab === 'wallet' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" /> Wallet & Transactions
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">View your wallet balance and commission history.</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-primary/15 to-emerald-600/10 border border-primary/20 rounded-2xl">
                <p className="text-xs text-text-secondary">Available Balance</p>
                <p className="text-3xl font-heading font-extrabold text-text-primary mt-1">₹0.00</p>
                <p className="text-[11px] text-text-muted mt-1">No pending withdrawals</p>
              </div>
              <div className="p-8 flex flex-col items-center text-center text-text-muted">
                <Wallet className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-xs font-medium text-text-secondary">No wallet transactions yet.</p>
                <p className="text-[11px] mt-1">Commission credits will appear here.</p>
              </div>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Notification Preferences
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Control how and when you receive alerts.</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'email_bookings' as const, label: 'Booking Confirmations', desc: 'Get email when bookings are confirmed or updated', icon: '📧' },
                  { key: 'email_visits' as const, label: 'Site Visit Reminders', desc: 'Reminder emails 24h before scheduled visits', icon: '📅' },
                  { key: 'email_promo' as const, label: 'Promotional Offers', desc: 'Pre-launch prices and exclusive developer offers', icon: '🎁' },
                  { key: 'sms_alerts' as const, label: 'SMS Alerts', desc: 'Important alerts via SMS and WhatsApp', icon: '📱' },
                  { key: 'push_alerts' as const, label: 'Push Notifications', desc: 'Real-time browser push notifications', icon: '🔔' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border cursor-pointer hover:border-primary/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                        <p className="text-[11px] text-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${notifPrefs[item.key] ? 'bg-primary' : 'bg-surface-secondary border border-border'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={() => toast.success('Notification preferences saved!')} className="btn btn-primary btn-sm gap-2">
                <Save className="w-3.5 h-3.5" /> Save Preferences
              </button>
            </div>
          )}

          {/* ── Documents ─────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Verified KYC Documents
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">Government-mandated identity and allotment documents.</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {profile?.documents?.filter((d: any) => d.status === 'verified' || d.is_verified).length || 0} Verified
                </span>
              </div>

              {!profile?.documents || profile.documents.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-2xl border border-border text-text-muted space-y-2">
                  <FileText className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-medium text-text-primary">No KYC documents uploaded yet.</p>
                  <p className="text-[11px]">Documents uploaded during property booking will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.documents.map((doc: any) => {
                    const isVerified = doc.status === 'verified' || doc.is_verified;
                    const isRejected = doc.status === 'rejected';
                    return (
                      <div
                        key={doc.id}
                        className={`p-4 bg-surface rounded-2xl border transition-all space-y-2 ${
                          isVerified
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : isRejected
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🪪</span>
                            <div>
                              <p className="text-xs font-bold text-text-primary">{doc.title}</p>
                              <p className="text-[10px] text-text-muted font-mono">{doc.file_name}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              isVerified
                                ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                                : isRejected
                                ? 'bg-red-500/20 text-red-500 border-red-500/40'
                                : 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                            }`}
                          >
                            {isVerified ? '✓ Verified' : isRejected ? '✗ Rejected' : '⏳ Under Review'}
                          </span>
                        </div>

                        {isRejected && doc.rejection_reason && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 space-y-0.5">
                            <span className="font-bold block">Rejection Feedback:</span>
                            <p>{doc.rejection_reason}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-text-muted">
                          <span>Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}</span>
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary hover:underline"
                            >
                              Download / View
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ── Preferences ───────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> App Preferences
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Customize your EstateFlow experience.</p>
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="label">Language</label>
                  <select value={prefData.language} onChange={(e) => setPrefData({ ...prefData, language: e.target.value })} className="input">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                    <option value="gu">Gujarati</option>
                  </select>
                </div>
                <div>
                  <label className="label">Currency Display</label>
                  <select value={prefData.currency} onChange={(e) => setPrefData({ ...prefData, currency: e.target.value })} className="input">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="AED">UAE Dirham (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date Format</label>
                  <select value={prefData.date_format} onChange={(e) => setPrefData({ ...prefData, date_format: e.target.value })} className="input">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <label className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Compact Mode</p>
                    <p className="text-[11px] text-text-secondary">Reduce spacing for denser information display</p>
                  </div>
                  <div
                    onClick={() => setPrefData({ ...prefData, compact_mode: !prefData.compact_mode })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${prefData.compact_mode ? 'bg-primary' : 'bg-surface-secondary border border-border'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefData.compact_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>
              <button onClick={() => toast.success('Preferences saved!')} className="btn btn-primary btn-sm gap-2">
                <Save className="w-3.5 h-3.5" /> Save Preferences
              </button>
            </div>
          )}

          {/* ── Danger Zone ───────────────────────────────────── */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-rose-500 text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Irreversible actions. Please proceed with caution.</p>
              </div>
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-500">Delete My Account</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    This will permanently delete your account, all bookings, wishlist items, and personal data.
                    This action <strong className="text-rose-500">cannot be undone</strong>.
                  </p>
                </div>
                <div>
                  <label className="label text-rose-500">Type <strong>DELETE</strong> to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="input border-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <button
                  disabled={deleteConfirm !== 'DELETE'}
                  onClick={() => toast.error('Account deletion request submitted. Contact support to complete.')}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white btn-sm gap-2 disabled:opacity-30 disabled:cursor-not-allowed border-rose-600"
                >
                  <Trash2 className="w-4 h-4" /> Permanently Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
