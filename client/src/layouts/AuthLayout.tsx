import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow-glow-primary group-hover:scale-105 transition-transform">
            <Building2 className="w-7 h-7" />
          </div>
          <span className="font-heading font-extrabold text-3xl text-text-primary tracking-tight">
            Estate<span className="text-primary">Flow</span>
          </span>
        </Link>
        <p className="text-xs text-text-secondary font-light tracking-wide uppercase">
          Enterprise Real Estate Customer Portal
        </p>
      </div>

      {/* Auth Card Content */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-card text-text-primary backdrop-blur-xl py-8 px-6 sm:px-10 shadow-card border border-border rounded-3xl space-y-6">
          <Outlet />
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-text-muted flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>256-Bit SSL Encrypted Enterprise Auth</span>
        </div>
      </div>
    </div>
  );
};
