import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  MessageCircle,
  PlayCircle,
  Users2,
  Shield,
  Award,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from '../../contexts/ToastContext';

const SOCIAL_LINKS = [
  { icon: Globe,          href: '#', label: 'Website',   color: 'hover:bg-slate-600' },
  { icon: Link2,          href: '#', label: 'LinkedIn',  color: 'hover:bg-blue-600' },
  { icon: MessageCircle,  href: '#', label: 'Twitter/X', color: 'hover:bg-sky-500' },
  { icon: PlayCircle,     href: '#', label: 'YouTube',   color: 'hover:bg-red-600' },
  { icon: Users2,         href: '#', label: 'Facebook',  color: 'hover:bg-blue-700' },
];

const TRUST_BADGES = [
  { icon: Shield,       label: 'RERA Registered' },
  { icon: Award,        label: 'ISO 27001 Certified' },
  { icon: CheckCircle2, label: 'Verified Listings' },
];

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    toast.success('Subscribed! You\'ll get weekly market insights.');
  };

  return (
    <footer className="bg-[#060D1E] text-white border-t border-slate-800/60">
      {/* Newsletter Band */}
      <div className="bg-gradient-to-r from-primary/20 via-slate-900 to-violet-900/20 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-bold text-white text-lg">
                📈 Get Weekly Real Estate Market Insights
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Price trends, new launches, RERA updates — straight to your inbox.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> You're subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 md:w-64 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition shadow-glow-primary whitespace-nowrap"
                >
                  Subscribe <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/60">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-primary text-white p-2 rounded-xl shadow-glow-primary group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white">
                Estate<span className="text-primary">Flow</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm font-light leading-relaxed">
              "Where Real Estate Flows Better." India's premier enterprise real estate ecosystem — designed for modern home buyers, premium builders, channel partners, and enterprise investors.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 rounded-xl bg-slate-800 ${color} flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-110`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full"
                >
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="text-[11px] text-slate-300 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-5">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { label: 'Browse Properties', to: '/properties' },
                { label: 'Upcoming Projects', to: '/projects' },
                { label: 'Trusted Builders', to: '/builders' },
                { label: 'About EstateFlow', to: '/about' },
                { label: 'Contact & Support', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-primary transition-colors hover:translate-x-1 inline-block transition-transform">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Cities */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-5">
              Top Cities
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { label: 'Mumbai Properties',     city: 'Mumbai' },
                { label: 'Pune Real Estate',      city: 'Pune' },
                { label: 'Bangalore Apartments',  city: 'Bangalore' },
                { label: 'Hyderabad Projects',    city: 'Hyderabad' },
                { label: 'Delhi NCR Villas',      city: 'Delhi NCR' },
              ].map(({ label, city }) => (
                <li key={city}>
                  <Link
                    to={`/properties?city=${city}`}
                    className="hover:text-primary transition-colors hover:translate-x-1 inline-block transition-transform"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-5">
              Headquarters
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">Worli Sea Face, BKC Annex,<br />Mumbai, MH 400051</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <a href="tel:+912280001234" className="hover:text-white transition-colors">+91 (022) 8000-ESTATE</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href="mailto:concierge@estateflow.com" className="hover:text-white transition-colors">concierge@estateflow.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} EstateFlow Technologies Pvt. Ltd. All rights reserved.</p>
            <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full font-mono text-[10px] font-bold">
              v2.0.0
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            {['Privacy Policy', 'Terms of Service', 'RERA Compliance', 'Cookie Policy', 'Sitemap'].map((item) => (
              <a key={item} href="#" className="hover:text-slate-300 transition-colors whitespace-nowrap">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
