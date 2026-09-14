import React from 'react';
import { Building2, CalendarCheck, ShieldCheck, DollarSign, Wallet, CheckCircle2, ArrowRight } from 'lucide-react';

export const CommissionFlowStepper: React.FC = () => {
  const steps = [
    { number: 1, title: 'Property Booking', sub: 'Customer places reservation', icon: Building2, active: true },
    { number: 2, title: 'Payment Confirmed', sub: 'Token / booking fee paid', icon: CalendarCheck, active: true },
    { number: 3, title: 'Rule Evaluation', sub: 'Multi-tier role % applied', icon: ShieldCheck, active: true },
    { number: 4, title: 'Wallet Credited', sub: 'Ledger transaction recorded', icon: Wallet, active: true },
    { number: 5, title: 'Monthly Settlement', sub: 'Batch payout to partner bank', icon: DollarSign, active: false },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-heading font-extrabold text-white">Automated Commission Workflow Architecture</h3>
          <p className="text-xs text-slate-400">Zero-latency revenue distribution pipeline from property booking to settlement</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          Automated Pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.number} className="relative flex flex-col items-center text-center space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                s.active ? 'bg-primary text-white shadow-glow-primary' : 'bg-slate-800 text-slate-500'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Step {s.number}</span>
                <p className="text-sm font-bold text-white leading-tight mt-0.5">{s.title}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.sub}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
