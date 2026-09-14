import React, { useState, useRef, useEffect } from 'react';
import { PropertyDetail } from '../../types/property';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsApi } from '../../api/bookings.api';
import { apiClient } from '../../api/axios';
import { toast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import {
  CheckCircle2, User, Building2, FileText, Check,
  ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Printer,
  CreditCard, QrCode, Landmark, Layers, Upload, X,
  AlertCircle, Clock, Lock, Info, BadgeCheck, Receipt, Copy,
  Smartphone, Shield, CheckCheck, Loader2, KeyRound, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookingWizardProps {
  property: PropertyDetail;
  onClose: () => void;
}

interface DocSlot {
  key: string;
  label: string;
  category: 'identity' | 'address' | 'income';
  description: string;
  required: boolean;
}

const DOC_SLOTS: DocSlot[] = [
  { key: 'aadhaar', label: 'Aadhaar Card', category: 'identity', description: 'Front & Back scan (PDF/JPG)', required: true },
  { key: 'pan', label: 'PAN Card', category: 'identity', description: 'Clear scan or photo', required: true },
  { key: 'passport_photo', label: 'Passport Size Photo', category: 'identity', description: 'Recent colour photo', required: false },
  { key: 'address_proof', label: 'Address Proof', category: 'address', description: 'Utility bill / Rent agreement / Bank statement', required: true },
  { key: 'income_proof', label: 'Income Proof', category: 'income', description: 'Salary slip / ITR / Form 16', required: false },
];

type UploadedDoc = { file: File; url: string; status: 'uploading' | 'uploaded' | 'error' };

export const BookingWizard: React.FC<BookingWizardProps> = ({ property, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    customer_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    customer_email: user?.email || '',
    customer_phone: '',
    customer_address: '',
    pan_number: '',
    aadhaar_number: '',
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc | null>>({
    aadhaar: null, pan: null, passport_photo: null, address_proof: null, income_proof: null,
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [upiApp, setUpiApp] = useState<string>('phonepe');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentStepStage, setPaymentStepStage] = useState<string>('');
  
  // Card input states
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false);

  // Timer for QR
  const [qrTimer, setQrTimer] = useState<number>(300); // 5 mins

  useEffect(() => {
    // No fake QR timer needed — Razorpay handles its own session timers
  }, [currentStep, paymentMethod]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [bookingResult, setBookingResult] = useState<{ booking_id: number; booking_number: string } | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    payment_id: string;
    amount: number;
    transaction_reference: string;
    payment_number?: string;
  } | null>(null);

  const basePrice = property.price || 0;
  const gstAmount = Math.round(basePrice * 0.05);
  const stampDuty = Math.round(basePrice * 0.06);
  const netTotal = basePrice + gstAmount + stampDuty;
  const tokenAmount = (property as any).booking_amount || 25000;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.customer_name.trim() || !formData.customer_email.trim() || !formData.customer_phone.trim()) {
        toast.error('Please enter name, email, and mobile number.');
        return false;
      }
      if (!formData.pan_number.trim()) {
        toast.error('PAN number is required for allotment.');
        return false;
      }
      if (!formData.aadhaar_number.trim()) {
        toast.error('Aadhaar number is required.');
        return false;
      }
    }
    if (currentStep === 3) {
      const requiredMissing = DOC_SLOTS.filter(
        (s) => s.required && (!uploadedDocs[s.key] || uploadedDocs[s.key]?.status !== 'uploaded')
      );
      if (requiredMissing.length > 0) {
        toast.error(`Please upload: ${requiredMissing.map((d) => d.label).join(', ')}`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep((p) => Math.min(p + 1, 6));
  };
  const handleBack = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const handleFileUpload = async (key: string, file: File) => {
    setUploadedDocs((prev) => ({ ...prev, [key]: { file, url: '', status: 'uploading' } }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'kyc');
      const res = await apiClient.post('/files/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedDocs((prev) => ({
        ...prev,
        [key]: { file, url: res.data.url, status: 'uploaded' },
      }));
      toast.success(`${file.name} uploaded successfully.`);
    } catch {
      setUploadedDocs((prev) => ({ ...prev, [key]: { file, url: '', status: 'error' } }));
      toast.error(`Failed to upload ${file.name}. Please try again.`);
    }
  };

  const removeDoc = (key: string) => setUploadedDocs((prev) => ({ ...prev, [key]: null }));

  // Main payment execution flow
  const executePaymentFlow = async (cardOtp = false) => {
    setPaymentProcessing(true);
    setIsSubmitting(true);
    setPaymentStepStage('Initiating booking on ledger...');

    try {
      // Gather uploaded KYC documents
      const docsToAttach = Object.entries(uploadedDocs)
        .filter(([_, doc]) => doc && doc.status === 'uploaded' && doc.url)
        .map(([key, doc]) => {
          const slot = DOC_SLOTS.find((s) => s.key === key);
          return {
            document_type: key,
            title: slot?.label || key.replace('_', ' ').toUpperCase(),
            file_name: doc!.file.name,
            file_url: doc!.url,
            file_size_bytes: doc!.file.size,
            mime_type: doc!.file.type || 'application/pdf',
          };
        });

      // 1. Create or reuse booking in database
      let bId = bookingResult?.booking_id;
      let bNumber = bookingResult?.booking_number;

      if (!bId) {
        setPaymentStepStage('Registering booking allotment in database...');
        const bookingRes = await bookingsApi.createBooking({
          property_id: property.id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_address: formData.customer_address,
          pan_number: formData.pan_number,
          aadhaar_number: formData.aadhaar_number,
          documents: docsToAttach,
        });

        bId = bookingRes.booking_id;
        bNumber = bookingRes.booking_number;
        setBookingResult({ booking_id: bId, booking_number: bNumber });
      }

      setPaymentStepStage('Initializing secure Razorpay payment order...');

      // 2. Create Payment Order
      const orderRes = await bookingsApi.createPaymentOrder(bId);
      if (orderRes.mode === 'unconfigured') {
        throw new Error(orderRes.notice || 'Razorpay is not configured on the server. Please configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET.');
      }

      // 3. Load official Razorpay Checkout SDK
      setPaymentStepStage('Opening Razorpay Payment Checkout...');
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) return resolve();
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Razorpay payment gateway SDK'));
        document.body.appendChild(s);
      });

      // 4. Open Razorpay modal and await real customer authorization
      const rzpResponse = await new Promise<{
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: orderRes.razorpay_key_id,
          amount: orderRes.amount_paise,
          currency: orderRes.currency,
          name: 'EstateFlow Luxury Real Estate',
          description: `Token Deposit for ${property.name}`,
          order_id: orderRes.razorpay_order_id,
          prefill: {
            name: formData.customer_name,
            email: formData.customer_email,
            contact: formData.customer_phone,
          },
          theme: { color: '#1F7A68' },
          handler: (response: any) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error('Payment window closed by customer')),
          },
        });
        rzp.open();
      });

      // 5. Server-side HMAC-SHA256 signature verification
      setPaymentStepStage('Verifying HMAC signature with banking switch...');
      const verifyRes = await bookingsApi.verifyPayment(bId, {
        razorpay_order_id: rzpResponse.razorpay_order_id,
        razorpay_payment_id: rzpResponse.razorpay_payment_id,
        razorpay_signature: rzpResponse.razorpay_signature,
        payment_method: paymentMethod,
      });

      setPaymentResult({
        payment_id: rzpResponse.razorpay_payment_id,
        amount: tokenAmount,
        transaction_reference: verifyRes.transaction_reference || rzpResponse.razorpay_payment_id,
        payment_number: verifyRes.payment_number,
      });

      setShowOtpModal(false);
      setCurrentStep(6);
      toast.success('Token deposit received! Booking confirmed successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || 'Payment processing failed.');
    } finally {
      setPaymentProcessing(false);
      setIsSubmitting(false);
      setPaymentStepStage('');
    }
  };

  const handlePayClick = () => {
    executePaymentFlow();
  };

  const uploadedCount = Object.values(uploadedDocs).filter((d) => d?.status === 'uploaded').length;
  const requiredTotal = DOC_SLOTS.filter((s) => s.required).length;
  const requiredUploaded = DOC_SLOTS.filter((s) => s.required && uploadedDocs[s.key]?.status === 'uploaded').length;

  const STEPS = [
    { number: 1, title: 'Buyer Info' },
    { number: 2, title: 'Financials' },
    { number: 3, title: 'KYC Upload' },
    { number: 4, title: 'Verification' },
    { number: 5, title: 'Token Payment' },
    { number: 6, title: 'Allotment Receipt' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface-secondary/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Official Allotment Flow</span>
              <h2 className="font-heading font-extrabold text-lg text-text-primary">Instant Property Booking</h2>
            </div>
          </div>
          {currentStep !== 6 && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3.5 bg-surface border-b border-border">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-border w-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step) => {
              const done = currentStep > step.number;
              const cur = currentStep === step.number;
              return (
                <div key={step.number} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-sm ${
                      done
                        ? 'bg-emerald-500 text-white'
                        : cur
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-surface border-2 border-border text-text-muted'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : step.number}
                  </div>
                  <span
                    className={`text-[9px] font-semibold mt-1 hidden sm:block transition-colors ${
                      cur ? 'text-primary' : done ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

          {/* STEP 1: Buyer Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Step 1: Primary Buyer Information
              </h3>
              <p className="text-xs text-text-secondary">
                Details will appear on your government allotment letter, RERA certificate, and stamped agreement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="label">Full Legal Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="As per Aadhaar / PAN"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Official Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="name@example.com"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Current City / Residential Address</label>
                  <input
                    type="text"
                    value={formData.customer_address}
                    onChange={(e) => handleInputChange('customer_address', e.target.value)}
                    placeholder="Mumbai, Maharashtra"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">PAN Card Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="input font-mono tracking-widest uppercase"
                  />
                </div>
                <div>
                  <label className="label">Aadhaar Card Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={formData.aadhaar_number}
                    onChange={(e) =>
                      handleInputChange(
                        'aadhaar_number',
                        e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                      )
                    }
                    placeholder="XXXX XXXX XXXX"
                    className="input font-mono tracking-widest"
                  />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Encrypted with AES-256 vault standard. Used strictly for government verification.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Financial Summary */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Step 2: Unit & Financial Summary
              </h3>
              <div className="bg-surface border border-border rounded-2xl p-4 flex gap-4 items-center shadow-soft">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-surface-secondary shrink-0">
                  {property.images?.[0] ? (
                    <img src={property.images[0].url} alt={property.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{property.property_type}</span>
                  <h4 className="font-heading font-bold text-sm text-text-primary truncate">{property.name}</h4>
                  <p className="text-xs text-text-secondary">{property.locality}, {property.city?.name}</p>
                </div>
              </div>

              <div className="bg-surface-secondary/60 border border-border rounded-2xl p-4 space-y-2.5 text-xs">
                {[
                  ['Base Agreement Value', formatCurrency(basePrice)],
                  ['GST @ 5%', formatCurrency(gstAmount)],
                  ['Stamp Duty & Registration @ 6%', formatCurrency(stampDuty)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-text-secondary">{k}:</span>
                    <span className="font-bold text-text-primary">{v}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-text-primary">All-Inclusive Total:</span>
                  <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(netTotal)}</span>
                </div>
                <div className="flex justify-between bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-2.5">
                  <span className="font-bold text-primary">Refundable Token Due Now:</span>
                  <span className="font-extrabold text-base text-primary">Rs.{tokenAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Balance Payable Upon Agreement:</span>
                  <span className="font-semibold text-text-secondary">{formatCurrency(netTotal - tokenAmount)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span className="flex items-center gap-1"><BadgeCheck className="w-4 h-4 text-emerald-500" /> 100% Refundable within 7 days</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-blue-500" /> RERA Registered Unit</span>
              </div>
            </div>
          )}

          {/* STEP 3: KYC Upload */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Step 3: KYC Document Upload
              </h3>
              <p className="text-xs text-text-secondary">Upload clear identity & address proof. Required documents marked with *.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{uploadedCount}/{DOC_SLOTS.length} documents uploaded</span>
                <span className={`font-bold ${requiredUploaded >= requiredTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {requiredUploaded}/{requiredTotal} mandatory uploaded
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
                  style={{ width: `${(uploadedCount / DOC_SLOTS.length) * 100}%` }}
                />
              </div>
              {(['identity', 'address', 'income'] as const).map((cat) => (
                <div key={cat}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">
                    {cat === 'identity' ? 'Identity Documents' : cat === 'address' ? 'Address Proof' : 'Income Proof'}
                  </span>
                  <div className="space-y-2">
                    {DOC_SLOTS.filter((s) => s.category === cat).map((slot) => {
                      const doc = uploadedDocs[slot.key];
                      return (
                        <div
                          key={slot.key}
                          className={`relative border rounded-2xl p-3 transition-all cursor-pointer ${
                            doc?.status === 'uploaded'
                              ? 'border-emerald-500/50 bg-emerald-500/5'
                              : doc?.status === 'error'
                              ? 'border-red-500/40 bg-red-500/5'
                              : doc?.status === 'uploading'
                              ? 'border-primary/40 bg-primary/5 animate-pulse'
                              : 'border-border bg-surface hover:border-primary/40'
                          }`}
                          onClick={() => !doc && fileInputRefs.current[slot.key]?.click()}
                        >
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(slot.key, f);
                              e.target.value = '';
                            }}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  doc?.status === 'uploaded'
                                    ? 'bg-emerald-500/20 text-emerald-600'
                                    : doc?.status === 'error'
                                    ? 'bg-red-500/20 text-red-500'
                                    : 'bg-surface-secondary text-text-muted'
                                }`}
                              >
                                {doc?.status === 'uploaded' ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : doc?.status === 'error' ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : doc?.status === 'uploading' ? (
                                  <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-text-primary">
                                  {slot.label}
                                  {slot.required && <span className="text-red-500 ml-0.5">*</span>}
                                </p>
                                <p className="text-[10px] text-text-muted truncate">
                                  {doc?.status === 'uploaded'
                                    ? doc.file.name
                                    : doc?.status === 'uploading'
                                    ? 'Uploading...'
                                    : doc?.status === 'error'
                                    ? 'Upload failed - click retry'
                                    : slot.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!doc && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[slot.key]?.click();
                                  }}
                                  className="btn btn-outline btn-xs gap-1 text-xs"
                                >
                                  <Upload className="w-3 h-3" />
                                  Upload
                                </button>
                              )}
                              {doc?.status === 'uploaded' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDoc(slot.key);
                                  }}
                                  className="p-1 text-text-muted hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {doc?.status === 'error' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[slot.key]?.click();
                                  }}
                                  className="btn btn-outline btn-xs text-xs border-red-500/40 text-red-500"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Document Verification Center */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" /> Step 4: KYC Document Review
              </h3>
              <p className="text-xs text-text-secondary">
                Review your uploaded documents before submitting. Uploaded documents are encrypted and assigned for Admin &amp; Compliance verification upon payment.
              </p>
              <div className="space-y-2">
                {DOC_SLOTS.map((slot) => {
                  const doc = uploadedDocs[slot.key];
                  const isUploaded = doc?.status === 'uploaded';
                  return (
                    <div
                      key={slot.key}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
                        isUploaded ? 'bg-surface border-border' : 'bg-surface-secondary/40 border-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isUploaded ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-surface text-text-muted'
                          }`}
                        >
                          {isUploaded ? <CheckCheck className="w-4 h-4" /> : <FileText className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{slot.label}</p>
                          <p className="text-[10px] text-text-muted">{isUploaded ? `Uploaded (${doc?.file.name})` : 'Pending Submission'}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isUploaded
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-surface-secondary text-text-muted border-border'
                        }`}
                      >
                        {isUploaded ? 'Ready for Review' : 'Incomplete'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center gap-2 text-xs text-primary font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Documents attached successfully. Proceed to deposit token to lock your unit and submit for compliance review.</span>
              </div>
            </div>
          )}

          {/* STEP 5: Razorpay Payment Gateway */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Step 5: Token Payment
                </h3>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured
                </div>
              </div>

              {/* Razorpay Notice */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-text-primary space-y-1.5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="font-bold mb-1 text-primary">Official Razorpay Checkout</p>
                    <p className="text-text-secondary">Clicking "Pay &amp; Confirm Booking" opens the secure Razorpay modal. Supports UPI, Cards, Net Banking, and Wallets with cryptographic HMAC-SHA256 signature verification.</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-2 text-xs shadow-soft">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">Property Unit:</span>
                  <span className="font-bold text-text-primary truncate max-w-[200px]">{property.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">Allottee Name:</span>
                  <span className="font-semibold text-text-primary">{formData.customer_name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">Base Price:</span>
                  <span className="font-semibold text-text-primary">₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">GST (5%):</span>
                  <span className="font-semibold text-text-primary">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span className="text-text-primary">Token Deposit Amount:</span>
                  <span className="text-primary font-extrabold">₹{tokenAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-2xl border border-border flex items-center gap-2 text-xs text-text-secondary">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Your payment is processed via Razorpay's PCI-DSS Level 1 compliant payment gateway. EstateFlow does not store card data.</span>
              </div>
            </div>
          )}


          {/* STEP 6: Confirmed Allotment & Digital Receipt */}
          {currentStep === 6 && bookingResult && paymentResult && (
            <div className="text-center py-2 space-y-5 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="inline-block badge badge-success text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 mb-2">
                  Allotment Locked & Paid
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-text-primary">Booking Confirmed!</h3>
                <p className="text-xs text-text-secondary mt-1">Official Government Allotment Reference:</p>
                <div className="inline-block bg-primary/10 border border-primary/30 font-mono text-lg font-bold text-primary px-4 py-1.5 rounded-xl mt-2 shadow-soft">
                  #{bookingResult.booking_number}
                </div>
              </div>

              {/* Printable Receipt Block */}
              <div className="print-receipt bg-surface rounded-2xl p-5 border border-border text-left text-xs space-y-3 max-w-lg mx-auto shadow-soft">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">{property.name}</h4>
                    <p className="text-text-secondary text-[11px]">{property.locality}, {property.city?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base block">
                      Rs.{paymentResult.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase">Token Paid</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-text-muted block">Allottee:</span>
                    <span className="font-bold text-text-primary">{formData.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Contact Phone:</span>
                    <span className="font-bold text-text-primary">{formData.customer_phone}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Transaction Ref:</span>
                    <span className="font-mono text-text-primary text-[10px] truncate block">{paymentResult.transaction_reference}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Payment Method:</span>
                    <span className="font-semibold text-text-primary uppercase">{paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Stamped & RERA Verified</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border bg-surface-secondary/40 flex items-center justify-between gap-3">
          {currentStep > 1 && currentStep < 6 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBack}
              className="btn btn-outline btn-sm gap-1.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {currentStep === 1 && (
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-xs">
              Cancel
            </button>
          )}

          {currentStep < 5 && (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary btn-sm gap-1.5 text-xs ml-auto shadow-soft"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 5 && (
            <button
              type="button"
              disabled={isSubmitting || paymentProcessing}
              onClick={handlePayClick}
              className="btn btn-primary btn-sm gap-2 text-xs ml-auto shadow-soft min-w-[170px] justify-center bg-gradient-to-r from-primary to-emerald-600 text-white font-bold"
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{paymentStepStage || 'Processing Payment...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay Rs.{tokenAmount.toLocaleString('en-IN')} & Book</span>
                </>
              )}
            </button>
          )}

          {currentStep === 6 && (
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-outline btn-sm gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" /> Print Allotment Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary btn-sm gap-1.5 text-xs shadow-soft"
              >
                Go to My Bookings <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>


    </div>
  );
};
