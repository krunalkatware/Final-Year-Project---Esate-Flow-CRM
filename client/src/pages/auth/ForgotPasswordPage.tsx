import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/axios';
import { Mail, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

// ── Password Strength Meter ────────────────────────────────────────────────────

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

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(newPassword);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep('sent');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) { setError('Please enter the reset token from your email.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { token: token.trim(), new_password: newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-text-primary">
          {step === 'done' ? 'Password Reset!' : 'Reset Password'}
        </h2>
        <p className="text-xs text-text-secondary">
          {step === 'email' && 'Enter your email to receive reset instructions'}
          {step === 'sent' && 'Check your inbox (or server console in dev mode)'}
          {step === 'reset' && 'Enter your reset token and choose a new password'}
          {step === 'done' && 'Your password has been updated successfully'}
        </p>
      </div>

      {/* Step: Email Entry */}
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
              <input
                type="email" required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="name@example.com"
                className="input pl-10"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? 'Sending…' : 'Send Reset Instructions'}
          </button>
        </form>
      )}

      {/* Step: Email Sent Confirmation */}
      {step === 'sent' && (
        <div className="space-y-4">
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-text-primary">Email instructions sent!</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>.<br />
              In development mode, the reset token is printed in the server console.
            </p>
          </div>
          <button
            onClick={() => setStep('reset')}
            className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft"
          >
            I have the reset token →
          </button>
          <button
            onClick={() => { setStep('email'); setError(null); }}
            className="btn btn-outline w-full justify-center text-sm"
          >
            Try a different email
          </button>
        </div>
      )}

      {/* Step: Token + New Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="label">Reset Token</label>
            <input
              type="text" required
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(null); }}
              placeholder="Paste your reset token here"
              className="input font-mono text-xs"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Copy the token from your email or from the server console log.
            </p>
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required minLength={8}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder="Min 8 characters"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password Strength Meter */}
            {newPassword && (
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
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Repeat password"
                className={`input pl-10 ${
                  confirmPassword && confirmPassword !== newPassword ? 'input-error' : ''
                }`}
              />
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="error-text">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || (confirmPassword !== '' && confirmPassword !== newPassword)}
            className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-text-primary">Password updated successfully!</p>
          <p className="text-xs text-text-secondary">You can now sign in with your new password.</p>
          <Link to="/login" className="btn btn-primary w-full justify-center shadow-soft">
            Continue to Sign In →
          </Link>
        </div>
      )}

      {/* Back to login link */}
      {step !== 'done' && (
        <div className="text-center pt-4 border-t border-border">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
};
