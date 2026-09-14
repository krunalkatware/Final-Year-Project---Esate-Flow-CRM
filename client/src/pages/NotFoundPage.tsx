import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Home, ArrowLeft, Search, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-8 animate-fade-in">
      <div className="relative">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center border border-primary/30 shadow-glow-primary">
          <Building2 className="w-12 h-12" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 p-2 rounded-xl">
          <ShieldAlert className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          Error 404
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white">Property or Page Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          The requested listing, dashboard route, or financial report could not be located on EstateFlow servers.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white text-sm font-bold rounded-2xl transition shadow-glow-primary"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
        <Link
          to="/properties"
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-2xl border border-slate-700 transition"
        >
          <Search className="w-4 h-4" /> Browse Properties
        </Link>
      </div>
    </div>
  );
};
