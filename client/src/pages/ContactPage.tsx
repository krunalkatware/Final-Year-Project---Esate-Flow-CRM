import React, { useState } from 'react';
import { toast } from '../contexts/ToastContext';
import { MapPin, Phone, Mail, Send, Building2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you! Your message has been sent to our relationship team.');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="badge badge-primary uppercase text-[10px]">Get in Touch</span>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">Contact EstateFlow Concierge</h1>
          <p className="text-sm text-text-secondary">Our property advisors are ready to assist your luxury home purchase.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-card flex items-start gap-4 transition-all">
              <div className="p-3 bg-primary-50 dark:bg-primary/20 text-primary rounded-2xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-heading font-bold text-sm text-text-primary">Headquarters</h4>
                <p className="text-text-secondary">Worli Sea Face, BKC Annex, Mumbai, MH 400051</p>
              </div>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-border shadow-card flex items-start gap-4 transition-all">
              <div className="p-3 bg-primary-50 dark:bg-primary/20 text-primary rounded-2xl">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-heading font-bold text-sm text-text-primary">Phone Advisory</h4>
                <p className="text-text-secondary">+91 (022) 8000-ESTATE</p>
                <p className="text-text-muted">Mon-Sat, 9AM - 8PM</p>
              </div>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-border shadow-card flex items-start gap-4 transition-all">
              <div className="p-3 bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-2xl">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-heading font-bold text-sm text-text-primary">Email Support</h4>
                <p className="text-text-secondary">concierge@estateflow.com</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-3xl p-8 border border-border shadow-card space-y-6 transition-all">
            <h3 className="font-heading font-bold text-xl text-text-primary">Send Us an Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Message / Property Inquiry *</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-md gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
