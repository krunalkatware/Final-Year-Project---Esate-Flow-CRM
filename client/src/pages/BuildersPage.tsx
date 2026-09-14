import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Award, Star, ArrowRight } from 'lucide-react';

export const BuildersPage: React.FC = () => {
  const builders = [
    { name: 'Godrej Properties', rating: 4.8, projects: 60, delivered: 42, HQ: 'Mumbai', est: 1990, desc: 'Trusted brand delivering quality homes with 125+ years of Godrej heritage.' },
    { name: 'Lodha Group', rating: 4.9, projects: 85, delivered: 62, HQ: 'Mumbai', est: 1980, desc: "India's leading real estate developer known for world-class luxury developments." },
    { name: 'Prestige Group', rating: 4.8, projects: 120, delivered: 95, HQ: 'Bangalore', est: 1986, desc: 'Bangalore-based premium developer with pan-India presence and 250+ awards.' },
    { name: 'Brigade Group', rating: 4.7, projects: 75, delivered: 58, HQ: 'Bangalore', est: 1986, desc: "South India's leading real estate conglomerate." },
    { name: 'Shapoorji Pallonji', rating: 4.9, projects: 45, delivered: 38, HQ: 'Mumbai', est: 1865, desc: 'Legendary construction group with 155 years of engineering excellence.' },
    { name: 'Sobha Limited', rating: 4.8, projects: 55, delivered: 41, HQ: 'Bangalore', est: 1995, desc: 'Premium developer known for backward integration and flawless quality.' },
  ];

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="badge badge-primary uppercase text-[10px]">Tier 1 Partners</span>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary mt-1">Trusted Developer Partners</h1>
          <p className="text-sm text-text-secondary mt-1">Direct developer partnerships guaranteeing inaugural pricing & zero brokerage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {builders.map((b) => (
            <div key={b.name} className="bg-card p-6 rounded-3xl border border-border shadow-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary-50 dark:bg-primary/20 text-primary rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="badge badge-success font-semibold text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Partner
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">{b.name}</h3>
                  <p className="text-xs text-text-secondary">Est. {b.est} • HQ: {b.HQ}</p>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-light">{b.desc}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-surface-secondary border border-border p-3 rounded-2xl">
                  <div>
                    <span className="text-text-muted block text-[10px]">Projects</span>
                    <span className="font-bold text-text-primary">{b.projects}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Delivered</span>
                    <span className="font-bold text-text-primary">{b.delivered}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Rating</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">★ {b.rating}</span>
                  </div>
                </div>

                <Link to={`/properties?search=${b.name}`} className="btn btn-primary btn-sm w-full justify-center gap-1">
                  Explore Developer Listings
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
