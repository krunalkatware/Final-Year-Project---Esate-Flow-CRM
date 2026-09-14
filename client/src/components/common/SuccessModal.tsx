import React, { useEffect } from 'react';
import { CheckCircle2, X, Download, Home, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'booking' | 'payment' | 'wallet' | 'profile' | 'generic';
  title?: string;
  subtitle?: string;
  referenceNo?: string;
  amount?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onDownload?: () => void;
}

const CONFIG = {
  booking: {
    icon: '🏡',
    gradient: 'from-emerald-500 to-teal-600',
    ringColor: 'ring-emerald-500/30',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    defaultTitle: 'Booking Confirmed!',
    defaultSubtitle: 'Your property booking has been successfully registered. Our team will contact you shortly.',
  },
  payment: {
    icon: '💳',
    gradient: 'from-blue-500 to-indigo-600',
    ringColor: 'ring-blue-500/30',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    defaultTitle: 'Payment Successful!',
    defaultSubtitle: 'Your payment has been processed and a receipt has been generated.',
  },
  wallet: {
    icon: '💰',
    gradient: 'from-amber-500 to-orange-600',
    ringColor: 'ring-amber-500/30',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    defaultTitle: 'Wallet Updated!',
    defaultSubtitle: 'Your commission has been credited to your EstateFlow wallet.',
  },
  profile: {
    icon: '✅',
    gradient: 'from-purple-500 to-violet-600',
    ringColor: 'ring-purple-500/30',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    defaultTitle: 'Profile Saved!',
    defaultSubtitle: 'Your profile information has been updated successfully.',
  },
  generic: {
    icon: '🎉',
    gradient: 'from-primary to-primary-600',
    ringColor: 'ring-primary/30',
    badgeColor: 'bg-primary/10 text-primary border-primary/30',
    defaultTitle: 'Success!',
    defaultSubtitle: 'The operation completed successfully.',
  },
};

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  referenceNo,
  amount,
  ctaLabel,
  ctaTo,
  onDownload,
}) => {
  const cfg = CONFIG[type];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Gradient top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-5">
          {/* Animated checkmark ring */}
          <div className={`relative w-20 h-20 rounded-full ring-4 ${cfg.ringColor} ring-offset-4 ring-offset-slate-900 flex items-center justify-center bg-gradient-to-br ${cfg.gradient} shadow-lg`}>
            <span className="text-3xl animate-bounce-subtle">{cfg.icon}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-heading font-extrabold text-white">
              {title || cfg.defaultTitle}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              {subtitle || cfg.defaultSubtitle}
            </p>
          </div>

          {/* Details */}
          {(referenceNo || amount) && (
            <div className={`w-full p-3 rounded-xl border ${cfg.badgeColor} space-y-1.5 text-left`}>
              {referenceNo && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Reference No.</span>
                  <span className="font-mono font-bold">{referenceNo}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Amount</span>
                  <span className="font-bold text-sm">{amount}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            )}
            {ctaTo ? (
              <Link
                to={ctaTo}
                onClick={onClose}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white text-xs font-bold rounded-xl shadow-sm transition hover:opacity-90`}
              >
                <Home className="w-4 h-4" /> {ctaLabel || 'Go to Dashboard'}
              </Link>
            ) : (
              <button
                onClick={onClose}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white text-xs font-bold rounded-xl shadow-sm transition hover:opacity-90`}
              >
                <CheckCircle2 className="w-4 h-4" /> {ctaLabel || 'Done'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
