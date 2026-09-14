import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { apiClient } from '../../../api/axios';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { initiateGoogleSignIn } from '../../../utils/googleAuth';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, adminGoogleLogin, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminLogin({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      let msg = 'Invalid credentials. Please try again.';
      const data = err?.response?.data;
      if (data) {
        if (typeof data.error === 'string' && data.error.trim()) msg = data.error;
        else if (typeof data.detail === 'string' && data.detail.trim()) msg = data.detail;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await initiateGoogleSignIn(
        async (credential: string) => {
          await adminGoogleLogin({ credential });
          navigate(from, { replace: true });
        },
        (err: any) => {
          // Silently reset if user just closed the popup
          if (err?.message !== 'popup_closed_by_user') {
            console.warn('[Google Sign-In]', err?.message);
          }
          setIsSubmitting(false);
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">

      {/* ── Left decorative panel (desktop only) ───────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900/30 to-slate-950" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-glow-primary">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
              Estate<span className="text-primary">Flow</span>
            </span>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Secure Admin Access
              </span>
            </div>
            <h1 className="text-4xl font-heading font-extrabold text-white leading-tight">
              Enterprise<br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Portal
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Centralised control for properties, leads, bookings, and customer operations — all secured with role-based access control.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              { label: 'Role-Based Access Control', desc: '5 roles · 12 permissions' },
              { label: 'JWT Secured Sessions', desc: 'Auto-refresh · Token rotation' },
              { label: 'Complete Audit Trail', desc: 'Every action logged' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} EstateFlow · Enterprise Real Estate Platform
        </div>
      </div>

      {/* ── Right login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-glow-primary">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-extrabold text-xl text-white">
            Estate<span className="text-primary">Flow</span>
          </span>
          <p className="text-xs text-slate-500">Admin Portal</p>
        </div>

        <div className="w-full max-w-md">
          {/* Form header */}
          <div className="mb-8 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-white">
              Sign in to Admin Portal
            </h2>
            <p className="text-sm text-slate-400">
              Enter your admin credentials to access the control panel
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/50 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form id="admin-login-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="admin@estateflow.com"
                  className="
                    w-full pl-10 pr-4 py-3 rounded-xl text-sm
                    bg-slate-800/60 border border-slate-700
                    text-white placeholder-slate-500
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs text-primary hover:text-primary-400 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="
                    w-full pl-10 pr-11 py-3 rounded-xl text-sm
                    bg-slate-800/60 border border-slate-700
                    text-white placeholder-slate-500
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30
                    transition-all duration-200
                  "
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5">
              <input
                id="admin-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary/50 focus:ring-offset-slate-950"
              />
              <label htmlFor="admin-remember-me" className="text-sm text-slate-400 cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2.5
                px-5 py-3.5 rounded-xl text-sm font-semibold
                bg-primary text-white
                hover:bg-primary-600
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-950
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-glow-primary
                transition-all duration-200 active:scale-[0.98]
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In to Admin Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-700 w-full" />
            <span className="absolute bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Or continue with</span>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 border border-slate-700 hover:border-slate-500 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Forgot Password */}
          <div className="text-center">
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-primary transition-colors">
              Forgot your password? <span className="font-semibold text-primary">Reset it here</span>
            </Link>
          </div>

          {/* Security note */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL encrypted · JWT secured · RBAC enforced</span>
          </div>

          {/* Demo hint */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 font-medium mb-1">Default Super Admin Credentials:</p>
            <p className="text-xs font-mono text-slate-400">
              admin@estateflow.com · <span className="text-slate-300">Admin@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
