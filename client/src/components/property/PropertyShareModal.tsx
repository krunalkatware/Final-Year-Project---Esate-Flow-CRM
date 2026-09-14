import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Check, QrCode, ExternalLink } from 'lucide-react';
import { toast } from '../../contexts/ToastContext';

interface PropertyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  propertyId: string | number;
}

export const PropertyShareModal: React.FC<PropertyShareModalProps> = ({
  isOpen,
  onClose,
  propertyName,
  propertyId,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const shareUrl = `${window.location.origin}/properties/${propertyId}`;

  // Generate simple QR using an external service (no dependency)
  useEffect(() => {
    if (isOpen) {
      const encoded = encodeURIComponent(shareUrl);
      setQrDataUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=0f172a&color=6366f1&margin=10`
      );
    }
  }, [isOpen, shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyName,
          text: `Check out this property on EstateFlow: ${propertyName}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-violet-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">Share Property</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{propertyName}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-40 h-40 rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500">Scan QR code to open property</p>

          {/* URL Copy Field */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono truncate">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`p-2.5 rounded-xl border transition flex-shrink-0 ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
