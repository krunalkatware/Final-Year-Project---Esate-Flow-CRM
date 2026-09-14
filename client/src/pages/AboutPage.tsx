import React from 'react';
import { Building2, ShieldCheck, Sparkles, Target, Users, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="pt-24 pb-16 bg-background min-h-screen space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="badge badge-primary uppercase tracking-wider text-[10px]">About EstateFlow</span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-text-primary">
            Where Real Estate Flows Better
          </h1>
          <p className="text-base text-text-secondary font-light leading-relaxed">
            EstateFlow is an Enterprise Real Estate Ecosystem connecting modern homebuyers with India's most reputable developers through transparent data, digital verification, and VIP site visit experiences.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-card space-y-4">
            <div className="p-3 bg-primary-50 dark:bg-primary/20 text-primary rounded-2xl w-fit">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-text-primary">Transparency First</h3>
            <p className="text-xs text-text-secondary leading-relaxed font-light">
              100% verified RERA certificates, clear all-inclusive pricing, and direct tie-ups with original developers.
            </p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-card space-y-4">
            <div className="p-3 bg-secondary-50 dark:bg-primary/20 text-primary rounded-2xl w-fit">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-text-primary">Modern Tech Platform</h3>
            <p className="text-xs text-text-secondary leading-relaxed font-light">
              Built on React 19, FastAPI, and PostgreSQL to deliver lightning-fast property search, real-time EMI math, and instant site visit scheduling.
            </p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-card space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-accent rounded-2xl w-fit">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-text-primary">Zero Brokerage</h3>
            <p className="text-xs text-text-secondary leading-relaxed font-light">
              Homebuyers pay absolute zero brokerage fees. Get inaugural pricing and exclusive developer offers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
