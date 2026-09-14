import React, { useState } from 'react';
import { toast } from '../../contexts/ToastContext';
import { Settings, Bell, Shield, Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [promoOffers, setPromoOffers] = useState(false);

  const handleSave = () => {
    toast.success('Preferences saved successfully!');
  };

  return (
    <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6 text-text-primary">
      <div className="border-b border-border pb-4">
        <h2 className="font-heading font-bold text-2xl text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Account & Notification Settings
        </h2>
        <p className="text-xs text-text-secondary mt-1">Configure your alerts and communication preferences</p>
      </div>

      <div className="space-y-6 text-sm">
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            Communication Channels
          </h3>

          <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-text-primary block text-xs">Email Notifications</span>
                <span className="text-[11px] text-text-secondary">Receive booking confirmations and site visit updates via email</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border accent-primary"
              />
            </label>

            <div className="divider my-2" />

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-text-primary block text-xs">SMS & WhatsApp Alerts</span>
                <span className="text-[11px] text-text-secondary">Instant SMS alerts for site visit reminders and relationship officer details</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border accent-primary"
              />
            </label>

            <div className="divider my-2" />

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-text-primary block text-xs">Promotional & Inaugural Offer Alerts</span>
                <span className="text-[11px] text-text-secondary">Receive pre-launch developer discounts and inaugural project pricing</span>
              </div>
              <input
                type="checkbox"
                checked={promoOffers}
                onChange={(e) => setPromoOffers(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border accent-primary"
              />
            </label>
          </div>
        </div>

        <button onClick={handleSave} className="btn btn-primary btn-sm">
          Save Preference Changes
        </button>
      </div>
    </div>
  );
};
