import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../contexts/ToastContext';
import { apiClient } from '../../api/axios';
import { Mail, Lock, User, Phone, UserPlus, Eye, EyeOff } from 'lucide-react';
import { initiateGoogleSignIn } from '../../utils/googleAuth';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-400' };
}

export const RegisterPage: React.FC = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const strength = getPasswordStrength(formData.password);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await initiateGoogleSignIn(
        async (credential: string) => {
          await googleLogin({ credential });
          toast.success('Signed in with Google! Welcome to EstateFlow 👋');
          navigate('/dashboard', { replace: true });
        },
        () => {
          setIsSubmitting(false);
        }
      );
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      toast.success('Registration successful! Welcome to EstateFlow.');
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Registration failed.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.error === 'string' && data.error.trim()) {
          errorMessage = data.error;
        } else if (typeof data.detail === 'string' && data.detail.trim()) {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMessage = data.detail[0].msg || JSON.stringify(data.detail[0]);
        } else if (typeof data.message === 'string' && data.message.trim()) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [accountType, setAccountType] = useState<'customer' | 'broker' | 'investor'>('customer');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-extrabold text-text-primary">Create Your Account</h2>
        <p className="text-xs text-text-secondary">Join EstateFlow — Choose your account type to get started</p>
      </div>

      {/* Registration Account Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">I am joining as:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'customer', label: 'Buyer / User' },
            { id: 'broker', label: 'Broker / Partner' },
            { id: 'investor', label: 'Investor' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setAccountType(type.id as any)}
              className={`p-2 rounded-xl text-xs font-bold border transition ${
                accountType === type.id
                  ? 'border-primary bg-primary/10 text-primary shadow-soft'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="First"
              className="input"
            />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Last"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Email Address *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@example.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label">Phone Number (Optional)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label">Password (Min 8 Chars) *</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="input pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-text-secondary hover:text-text-primary transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[10px] font-semibold ${
                strength.score <= 1 ? 'text-red-500' :
                strength.score === 2 ? 'text-amber-600' :
                strength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'
              }`}>
                {strength.label} password
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="label">Confirm Password *</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className={`input pl-10 ${
                confirmPassword && confirmPassword !== formData.password ? 'border-red-400' : ''
              }`}
            />
          </div>
          {confirmPassword && confirmPassword !== formData.password && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
          <UserPlus className="w-4 h-4" />
        </button>
      </form>

      {/* Social Google Sign Up */}
      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider absolute">
            Or sign up with
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
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
