import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Key,
  Globe,
  Lock,
  Monitor,
  Users,
  Database,
  Save,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Webhook,
} from 'lucide-react';
import { toast } from '../../../contexts/ToastContext';
import { ThemeToggle } from '../../../components/common/ThemeToggle';
import { apiClient } from '../../../api/axios';

type Tab =
  | 'general'
  | 'appearance'
  | 'security'
  | 'notifications'
  | 'privacy'
  | 'language'
  | 'sessions'
  | 'api';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'General',        icon: Globe },
  { id: 'appearance',    label: 'Appearance',      icon: Monitor },
  { id: 'security',      label: 'Security',        icon: Shield },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'privacy',       label: 'Privacy & RBAC',  icon: Lock },
  { id: 'language',      label: 'Language',        icon: Settings },
  { id: 'sessions',      label: 'Sessions',        icon: Users },
  { id: 'api',           label: 'API & Webhooks',  icon: Webhook },
];

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div onClick={onChange} className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-surface-secondary border border-border'}`}>
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </div>
);

const ToggleRow: React.FC<{ label: string; desc: string; checked: boolean; onChange: () => void }> = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-3.5 bg-surface-secondary/50 rounded-xl border border-border transition">
    <div>
      <p className="text-xs font-semibold text-text-primary">{label}</p>
      <p className="text-[11px] text-text-secondary mt-0.5">{desc}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition" />
);

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
  <select {...props} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition">
    {children}
  </select>
);

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showKey, setShowKey] = useState(false);

  // General
  const [general, setGeneral] = useState({
    platform_name: 'EstateFlow Enterprise',
    support_email: 'support@estateflow.com',
    support_phone: '+91 98765 43210',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    fiscal_year: 'April-March',
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    email_booking: true,
    email_site_visit: true,
    email_payment: true,
    email_revenue: true,
    sms_commission: true,
    sms_booking: false,
    sms_site_visit: true,
    push_all: true,
    weekly_report: true,
  });

  // Security
  const [security, setSecurity] = useState({
    two_factor: false,
    session_timeout: '8',
    login_notifications: true,
    failed_login_lock: true,
    ip_whitelist: false,
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    audit_log: true,
    data_masking: false,
    gdpr_mode: false,
    customer_data_export: true,
  });

  const apiKey = 'ef_live_8a3f9b1c2d4e5f6789abcdef01234567';
  const webhookSecret = 'whsec_a1b2c3d4e5f6789012345678abcdefgh';

  const handleSave = () => toast.success('Configuration saved successfully!');
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">System Settings & Governance</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure global enterprise parameters, RBAC, security policies and API webhooks</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition shadow-glow-primary self-start sm:self-auto"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-2 space-y-0.5 h-fit shadow-soft">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-6 shadow-soft">

          {/* ── General ─────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-text-primary text-base">General & Platform</h2>
                <p className="text-xs text-text-secondary mt-0.5">Core configuration for the EstateFlow platform.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <Field label="Platform Name">
                  <InputField value={general.platform_name} onChange={(e) => setGeneral({ ...general, platform_name: e.target.value })} />
                </Field>
                <Field label="Support Email">
                  <InputField type="email" value={general.support_email} onChange={(e) => setGeneral({ ...general, support_email: e.target.value })} />
                </Field>
                <Field label="Support Phone">
                  <InputField type="tel" value={general.support_phone} onChange={(e) => setGeneral({ ...general, support_phone: e.target.value })} />
                </Field>
                <Field label="Default Currency">
                  <SelectField value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                    <option value="INR">INR (₹) – Indian Rupee</option>
                    <option value="USD">USD ($) – US Dollar</option>
                    <option value="AED">AED (د.إ) – UAE Dirham</option>
                  </SelectField>
                </Field>
                <Field label="Timezone">
                  <SelectField value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </SelectField>
                </Field>
                <Field label="Fiscal Year">
                  <SelectField value={general.fiscal_year} onChange={(e) => setGeneral({ ...general, fiscal_year: e.target.value })}>
                    <option value="April-March">April – March (Indian)</option>
                    <option value="January-December">January – December (Calendar)</option>
                  </SelectField>
                </Field>
              </div>

              {/* Demo Data Management */}
              <div className="mt-8 border-t border-slate-800 pt-6 max-w-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">Presentation Demo Dataset Management</h3>
                    <p className="text-xs text-slate-400">Re-seed 25+ realistic properties, demo users, leads, site visits & revenue rules for committee presentation.</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to reset and re-seed the presentation demo dataset? This will restore initial demo properties, leads, and revenue rules.")) {
                      try {
                        const res = await apiClient.post('/admin/dashboard/reset-demo-data');
                        toast.success(res.data.message || 'Demo dataset re-seeded successfully!');
                      } catch (err: any) {
                        toast.error(err.response?.data?.error || 'Failed to reset demo dataset.');
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Demo Data
                </button>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">Platform is running on <strong className="text-white">EstateFlow v2.0</strong> with all systems operational.</p>
              </div>
            </div>
          )}

          {/* ── Appearance ──────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Appearance & Theme</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control the visual theme for the entire admin platform.</p>
              </div>
              <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-white mb-3">Color Theme</p>
                  <ThemeToggle />
                </div>
                <p className="text-[11px] text-slate-500">
                  🌞 Light — 🌙 Dark — 💻 System (follows your OS preference). Changes apply instantly with smooth transitions.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Indigo (Default)', 'Teal', 'Violet'].map((c, i) => (
                  <div key={c} className={`p-3 rounded-xl border text-center cursor-pointer transition ${i === 0 ? 'border-primary bg-primary/10' : 'border-slate-800 hover:border-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full mx-auto mb-2 ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-teal-500' : 'bg-violet-500'}`} />
                    <p className="text-[11px] font-bold text-white">{c}</p>
                    {i === 0 && <p className="text-[10px] text-primary mt-0.5">Active</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Security ────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Security Policies</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure authentication, session, and login security.</p>
              </div>
              <ToggleRow label="Two-Factor Authentication (2FA)" desc="Require OTP on admin logins" checked={security.two_factor} onChange={() => setSecurity({ ...security, two_factor: !security.two_factor })} />
              <ToggleRow label="Login Activity Notifications" desc="Email alert for every successful admin login" checked={security.login_notifications} onChange={() => setSecurity({ ...security, login_notifications: !security.login_notifications })} />
              <ToggleRow label="Failed Login Lockout" desc="Lock account after 5 consecutive failed attempts" checked={security.failed_login_lock} onChange={() => setSecurity({ ...security, failed_login_lock: !security.failed_login_lock })} />
              <ToggleRow label="IP Whitelist Enforcement" desc="Restrict admin access to whitelisted IPs only" checked={security.ip_whitelist} onChange={() => setSecurity({ ...security, ip_whitelist: !security.ip_whitelist })} />
              <Field label="Session Timeout (Hours)">
                <SelectField value={security.session_timeout} onChange={(e) => setSecurity({ ...security, session_timeout: e.target.value })}>
                  <option value="1">1 Hour</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="168">7 Days</option>
                </SelectField>
              </Field>
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300">Enabling 2FA requires all admin users to set up an authenticator app on next login.</p>
              </div>
            </div>
          )}

          {/* ── Notifications ───────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Email & Alert Settings</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control transactional emails and system alerts.</p>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Triggers</p>
              <ToggleRow label="Booking Confirmation Email" desc="Send email when booking is confirmed" checked={notifs.email_booking} onChange={() => setNotifs({ ...notifs, email_booking: !notifs.email_booking })} />
              <ToggleRow label="Site Visit Reminder" desc="Send 24h reminder email before visit" checked={notifs.email_site_visit} onChange={() => setNotifs({ ...notifs, email_site_visit: !notifs.email_site_visit })} />
              <ToggleRow label="Payment Receipt" desc="Auto-email receipt after payment" checked={notifs.email_payment} onChange={() => setNotifs({ ...notifs, email_payment: !notifs.email_payment })} />
              <ToggleRow label="Commission Credit Alert" desc="Email partners when commission is credited" checked={notifs.email_revenue} onChange={() => setNotifs({ ...notifs, email_revenue: !notifs.email_revenue })} />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">SMS Alerts</p>
              <ToggleRow label="SMS Commission Payout" desc="SMS to broker on wallet credit" checked={notifs.sms_commission} onChange={() => setNotifs({ ...notifs, sms_commission: !notifs.sms_commission })} />
              <ToggleRow label="SMS Booking Update" desc="SMS to customer on booking status change" checked={notifs.sms_booking} onChange={() => setNotifs({ ...notifs, sms_booking: !notifs.sms_booking })} />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">Reports</p>
              <ToggleRow label="Weekly Revenue Report" desc="Auto-send weekly revenue summary to Super Admin" checked={notifs.weekly_report} onChange={() => setNotifs({ ...notifs, weekly_report: !notifs.weekly_report })} />
            </div>
          )}

          {/* ── Privacy & RBAC ──────────────────────────────────── */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Privacy & Role-Based Access</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure data governance, masking and RBAC roles.</p>
              </div>
              <div className="space-y-3 max-w-xl">
                <ToggleRow label="Audit Log" desc="Log every admin action with timestamp and IP" checked={privacy.audit_log} onChange={() => setPrivacy({ ...privacy, audit_log: !privacy.audit_log })} />
                <ToggleRow label="Customer Data Masking" desc="Mask phone/email in reports visible to Sales Executives" checked={privacy.data_masking} onChange={() => setPrivacy({ ...privacy, data_masking: !privacy.data_masking })} />
                <ToggleRow label="GDPR Compliance Mode" desc="Enable right-to-erasure and data export features" checked={privacy.gdpr_mode} onChange={() => setPrivacy({ ...privacy, gdpr_mode: !privacy.gdpr_mode })} />
                <ToggleRow label="Customer Data Export" desc="Allow customers to download their personal data" checked={privacy.customer_data_export} onChange={() => setPrivacy({ ...privacy, customer_data_export: !privacy.customer_data_export })} />
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Active RBAC Roles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { role: 'Super Admin', perms: 'Full system access & governance', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                    { role: 'Admin', perms: 'Properties, bookings, revenue', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { role: 'Sales Manager', perms: 'CRM, site visits, reports', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                    { role: 'Sales Executive', perms: 'Leads, visits (own only)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                    { role: 'Channel Partner', perms: 'Wallet, commission history', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
                  ].map(({ role, perms, color }) => (
                    <div key={role} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white">{role}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>Active</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{perms}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Language ────────────────────────────────────────── */}
          {activeTab === 'language' && (
            <div className="space-y-5 max-w-md">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Language & Localization</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure language and regional format settings.</p>
              </div>
              <Field label="Platform Language">
                <SelectField defaultValue="en">
                  <option value="en">🇺🇸 English (Default)</option>
                  <option value="hi">🇮🇳 Hindi (हिंदी)</option>
                  <option value="mr">🇮🇳 Marathi (मराठी)</option>
                  <option value="gu">🇮🇳 Gujarati (ગુજરાતી)</option>
                </SelectField>
              </Field>
              <Field label="Number Format">
                <SelectField defaultValue="indian">
                  <option value="indian">Indian (1,00,000)</option>
                  <option value="international">International (100,000)</option>
                </SelectField>
              </Field>
              <Field label="Date Format">
                <SelectField defaultValue="DD/MM/YYYY">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </SelectField>
              </Field>
              <Field label="Time Format">
                <SelectField defaultValue="12h">
                  <option value="12h">12-Hour (AM/PM)</option>
                  <option value="24h">24-Hour</option>
                </SelectField>
              </Field>
              <button onClick={handleSave} className="btn btn-primary btn-sm gap-2">
                <Save className="w-3.5 h-3.5" /> Apply Language Settings
              </button>
            </div>
          )}

          {/* ── Sessions ────────────────────────────────────────── */}
          {activeTab === 'sessions' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-white text-base">Active Admin Sessions</h2>
                <p className="text-xs text-slate-400 mt-0.5">View and manage all active admin login sessions.</p>
              </div>
              <div className="space-y-3">
                {[
                  { user: 'Krunal Katware', role: 'Super Admin', device: 'Chrome — Windows 11', location: 'Mumbai, IN', time: 'Active now', current: true },
                  { user: 'Rahul Sharma', role: 'Sales Manager', device: 'Safari — macOS', location: 'Pune, IN', time: '2 hours ago', current: false },
                  { user: 'Priya Mehta', role: 'Admin', device: 'Chrome — Android', location: 'Delhi, IN', time: '1 day ago', current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                        {s.user[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{s.user}</p>
                        <p className="text-[11px] text-slate-400">{s.role} · {s.device} · {s.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.current ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                        {s.current ? '● Active' : s.time}
                      </span>
                      {!s.current && (
                        <button
                          onClick={() => toast.success(`Session for ${s.user} revoked.`)}
                          className="text-[11px] font-bold text-red-400 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success('All other sessions have been terminated.')}
                className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Terminate All Other Sessions
              </button>
            </div>
          )}

          {/* ── API & Webhooks ──────────────────────────────────── */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-bold text-white text-base">API Keys & Webhooks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage production API keys and configure webhook endpoints.</p>
              </div>

              {/* API Keys */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">API Keys</p>
                {[
                  { label: 'Production API Key', value: apiKey, prefix: 'ef_live_' },
                  { label: 'Webhook Secret', value: webhookSecret, prefix: 'whsec_' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-white transition">
                          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(item.value, item.label)}
                          className="text-slate-400 hover:text-white transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toast.success('New key generated. Update your integrations.')}
                          className="text-slate-400 hover:text-white transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 truncate">
                      {showKey ? item.value : `${item.prefix}${'•'.repeat(32)}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Webhook Endpoints */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Webhook Endpoints</p>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <Field label="Booking Webhook URL">
                    <InputField placeholder="https://your-system.com/webhooks/booking" />
                  </Field>
                  <Field label="Payment Webhook URL">
                    <InputField placeholder="https://your-system.com/webhooks/payment" />
                  </Field>
                  <Field label="Commission Webhook URL">
                    <InputField placeholder="https://your-system.com/webhooks/commission" />
                  </Field>
                  <button
                    onClick={() => toast.success('Webhook endpoints saved!')}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Webhooks
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Database className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white">API Rate Limits</p>
                  <p>Production: <strong>1,000 req/min</strong> · Webhooks: <strong>HMAC-SHA256 signed</strong> · TLS 1.3 enforced</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
