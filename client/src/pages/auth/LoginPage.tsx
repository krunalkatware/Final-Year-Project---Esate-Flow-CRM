import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { toast } from '../../contexts/ToastContext';
import { apiClient } from '../../api/axios';
import { Mail, Lock, LogIn, Shield, User, HardHat, Users, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { initiateGoogleSignIn } from '../../utils/googleAuth';

interface RoleOption {
  id: string;
  label: string;
  badge: string;
  icon: React.ElementType;
  email: string;
  pass: string;
  isAdmin: boolean;
}

const roleOptions: RoleOption[] = [
  { id: 'customer', label: 'Customer / Buyer', badge: 'Public Buyer', icon: User, email: 'customer@estateflow.com', pass: 'Customer@123', isAdmin: false },
  { id: 'broker', label: 'Broker / Partner', badge: 'Channel Partner', icon: HardHat, email: 'admin@estateflow.com', pass: 'Admin@123', isAdmin: true },
  { id: 'sales_exec', label: 'Sales Executive', badge: 'Sales Rep', icon: Users, email: 'admin@estateflow.com', pass: 'Admin@123', isAdmin: true },
  { id: 'sales_mgr', label: 'Sales Manager', badge: 'Team Lead', icon: Building2, email: 'admin@estateflow.com', pass: 'Admin@123', isAdmin: true },
  { id: 'admin', label: 'Super Admin / Head', badge: 'Enterprise Head', icon: Shield, email: 'admin@estateflow.com', pass: 'Admin@123', isAdmin: true },
];

export const LoginPage: React.FC = () => {
  const { login: customerLogin, googleLogin } = useAuth();
  const { adminLogin, adminGoogleLogin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<RoleOption>(roleOptions[0]);
  const [email, setEmail] = useState(roleOptions[0].email);
  const [password, setPassword] = useState(roleOptions[0].pass);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setEmail(role.email);
    setPassword(role.pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRole.isAdmin) {
        await adminLogin({ email, password });
        toast.success(`Welcome to EstateFlow ${selectedRole.label} Portal!`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        await customerLogin({ email, password, remember_me: rememberMe });
        toast.success('Welcome back to EstateFlow!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      let errorMessage = 'Invalid credentials for selected account type.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.error === 'string' && data.error.trim()) errorMessage = data.error;
        else if (typeof data.detail === 'string' && data.detail.trim()) errorMessage = data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await initiateGoogleSignIn(
        async (credential: string) => {
          if (selectedRole.isAdmin) {
            await adminGoogleLogin({ credential });
            toast.success(`Welcome to EstateFlow Admin Portal (${selectedRole.label})!`);
            navigate('/admin/dashboard', { replace: true });
          } else {
            await googleLogin({ credential });
            toast.success('Signed in with Google! Welcome to EstateFlow 👋');
            navigate('/dashboard', { replace: true });
          }
        },
        (err: any) => {
          // Silently reset if user just closed the popup
          if (err?.message !== 'popup_closed_by_user') {
            console.warn('[Google Sign-In]', err?.message);
          }
          setIsSubmitting(false);
        }
      );
    } catch {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Unified Access Portal
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-text-primary">Sign in to EstateFlow</h2>
        <p className="text-xs text-text-secondary">Select your account type below to access your personalized dashboard</p>
      </div>

      {/* Account Type Selector Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">What is your role?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole.id === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-soft font-bold'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold block leading-snug text-text-primary">{role.label}</span>
                  <span className="text-[9px] text-text-muted font-medium block">{role.badge}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => setIsCapsLockOn(e.getModifierState('CapsLock'))}
              placeholder="••••••••"
              className="input pl-10"
            />
          </div>
          {isCapsLockOn && (
            <p className="text-[11px] font-bold text-amber-500 mt-1 flex items-center gap-1">
              <span>⚠️</span> Caps Lock is ON
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft"
        >
          {isSubmitting ? 'Authenticating...' : `Sign in as ${selectedRole.label}`}
          <LogIn className="w-4 h-4" />
        </button>
      </form>

      {/* Social Google Login */}
      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider absolute">
            Or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface border border-border hover:border-primary/40 rounded-2xl text-xs font-bold text-text-primary shadow-sm transition hover:bg-surface-secondary disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};
