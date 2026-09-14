import React from 'react';
import { Sparkles, CalendarCheck, MapPin, Target, DollarSign, Wallet, ArrowUpRight, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GreetingProps {
  userName?: string;
  userRole?: string;
  metrics?: {
    newLeads?: number;
    siteVisits?: number;
    bookings?: number;
    todayRevenue?: string;
    pendingSettlement?: string;
    walletBalance?: string;
  };
}

export const PersonalizedGreetingHeader: React.FC<GreetingProps> = ({
  userName = 'Krunal',
  userRole = 'Executive',
  metrics = {
    newLeads: 12,
    siteVisits: 5,
    bookings: 2,
    todayRevenue: '₹2,45,000',
    pendingSettlement: '₹1,20,000',
    walletBalance: '₹4,85,000',
  },
}) => {
  const navigate = useNavigate();

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
      {/* Top Bar: Time Greeting & User Name */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{getGreeting()}, {userName} 👋</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Here's your enterprise summary today
          </h2>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/properties/create')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition shadow-glow-primary"
          >
            <Plus className="w-3.5 h-3.5" /> Add Property
          </button>
          <button
            onClick={() => navigate('/admin/crm/leads')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <Target className="w-3.5 h-3.5 text-indigo-400" /> New Lead
          </button>
        </div>
      </div>

      {/* Today's KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'New Leads', val: metrics.newLeads, sub: 'Today', color: 'text-indigo-400', icon: Target },
          { label: 'Site Visits', val: metrics.siteVisits, sub: 'Scheduled', color: 'text-amber-400', icon: MapPin },
          { label: 'Bookings', val: metrics.bookings, sub: 'Confirmed', color: 'text-emerald-400', icon: CalendarCheck },
          { label: 'Today Revenue', val: metrics.todayRevenue, sub: 'Gross Value', color: 'text-white', icon: DollarSign },
          { label: 'Pending Settlement', val: metrics.pendingSettlement, sub: 'Escrow', color: 'text-amber-300', icon: ShieldCheck },
          { label: 'Wallet Balance', val: metrics.walletBalance, sub: 'Available', color: 'text-emerald-400', icon: Wallet },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <p className={`text-lg font-extrabold ${item.color} font-heading`}>{item.val}</p>
              <p className="text-[9px] text-slate-500">{item.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
