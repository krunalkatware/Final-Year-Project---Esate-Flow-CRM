import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/common/SearchBar';
import { PropertyCard } from '../components/property/PropertyCard';
import { useFeaturedProperties } from '../hooks/useProperties';
import { PropertyCardSkeleton } from '../components/common/SkeletonLoader';
import { 
  Building2, 
  ShieldCheck, 
  Search, 
  Calendar, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Star,
  ChevronDown,
  Lock,
  PhoneCall,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: featuredProperties = [], isLoading } = useFeaturedProperties();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const builderLogos = [
    { name: 'Godrej Properties', rating: '4.8 ★', projects: '60+ Projects' },
    { name: 'Lodha Group', rating: '4.9 ★', projects: '85+ Projects' },
    { name: 'Prestige Group', rating: '4.8 ★', projects: '120+ Projects' },
    { name: 'Brigade Group', rating: '4.7 ★', projects: '75+ Projects' },
    { name: 'Shapoorji Pallonji', rating: '4.9 ★', projects: '45+ Projects' },
    { name: 'Sobha Limited', rating: '4.8 ★', projects: '55+ Projects' },
  ];

  const whyChooseUs = [
    {
      title: '100% Verified Listings',
      desc: 'Every property on EstateFlow is physically inspected & RERA verified for complete peace of mind.',
      icon: ShieldCheck,
      color: 'text-primary bg-primary-50',
    },
    {
      title: 'Smart Search & EMI Engine',
      desc: 'Find homes matching your exact budget, ROI expectations, and location preferences in seconds.',
      icon: Search,
      color: 'text-secondary bg-secondary-50',
    },
    {
      title: 'Instant VIP Site Visit Booking',
      desc: 'Schedule private chauffeured site visits directly with top developer relationship managers.',
      icon: Calendar,
      color: 'text-accent bg-amber-50',
    },
    {
      title: 'Tier-1 Trusted Builders',
      desc: 'Direct tie-ups with India\'s most reputable developers ensuring inaugural pricing and zero brokerage.',
      icon: Award,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Secure Digital Process',
      desc: 'Transparent documentation, digital reservation, and end-to-end legal support.',
      icon: Lock,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  const stats = [
    { value: '30+', label: 'Luxury Properties' },
    { value: '5', label: 'Tier 1 Cities' },
    { value: '12,500+', label: 'Happy Customers' },
    { value: '100+', label: 'Delivered Projects' },
  ];

  const testimonials = [
    {
      name: 'Vikram Malhotra',
      role: 'Property Investor, Mumbai',
      text: 'EstateFlow made purchasing our Worli penthouse seamless. The ROI calculator and instant site visit booking were game changers.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
    {
      name: 'Ananya Deshmukh',
      role: 'First-time Homebuyer, Pune',
      text: 'The interface is stunning! Filtering by builder and possession date helped us find our dream Prestige villa in Koregaon Park.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
    },
    {
      name: 'Rajesh Iyer',
      role: 'Tech Lead, Bangalore',
      text: 'Zero brokerage, transparent RERA numbers, and direct connect with builder relationship managers. Highly recommended!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    },
  ];

  const faqs = [
    {
      question: 'Is EstateFlow a direct property portal or a broker?',
      answer: 'EstateFlow is an enterprise technology platform connecting home buyers directly with Tier-1 RERA registered developers. We do not charge home buyers any brokerage fee.',
    },
    {
      question: 'How do I schedule a site visit for a property?',
      answer: 'Click on any property, hit "Book Site Visit", select your preferred date and time slot. Our relationship executive will arrange free pickup or meet you at the site location.',
    },
    {
      question: 'Are all properties listed on EstateFlow RERA verified?',
      answer: 'Yes, 100% of properties listed on EstateFlow undergo mandatory legal documentation verification and hold active RERA registration certificates.',
    },
    {
      question: 'What cities does EstateFlow currently operate in?',
      answer: 'EstateFlow currently features prime residential and luxury projects across Mumbai, Pune, Bangalore, Hyderabad, and Delhi NCR.',
    },
  ];

  return (
    <div className="pb-16 bg-background text-text-primary transition-colors duration-200">
      
      {/* ── HERO SECTION WITH PREMIUM VIDEO BACKGROUND ──────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-20 overflow-hidden text-white"
        style={{ background: '#16324F' }}
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            className="w-full h-full object-cover"
            style={{ opacity: 0.28 }}
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-40618-large.mp4" type="video/mp4" />
          </video>
          {/* Premium warm navy gradient overlay — NOT pure black */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(22,50,79,0.92) 0%, rgba(15,35,60,0.82) 40%, rgba(22,50,79,0.95) 100%)',
            }}
          />
          {/* Subtle champagne gold bottom strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(198,161,91,0.4), transparent)' }}
          />
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause Intro Video' : 'Play Intro Video'}
            className="p-2.5 rounded-full backdrop-blur-md transition-all bg-white/10 border border-white/20 hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Video' : 'Mute Video'}
            className="p-2.5 rounded-full backdrop-blur-md transition-all bg-white/10 border border-white/20 hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Premium Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold animate-fade-in bg-amber-500/15 border border-amber-400/30 text-amber-300 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Premium Enterprise Real Estate Platform</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-5 max-w-5xl mx-auto">
            <h1
              className="text-4xl md:text-6xl lg:text-[4.5rem] font-heading font-extrabold tracking-tight leading-[1.1] text-balance text-white"
            >
              Find a Place{' '}
              <span className="text-amber-400">Worth Calling</span>{' '}Yours.
            </h1>
            <p
              className="text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed text-white/80"
            >
              Discover exceptional properties, trusted opportunities, and a smarter way to manage your real estate journey.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/properties"
              className="btn btn-primary text-base px-7 py-3.5 shadow-glow-emerald font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all"
            >
              Explore Properties
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/properties"
              className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl transition-all hover:scale-105 bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/20"
            >
              <Calendar className="w-5 h-5 text-amber-400" />
              Schedule a Visit
            </Link>
          </div>

          {/* Search Bar */}
          <div className="pt-6">
            <SearchBar />
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
            {[
              { icon: ShieldCheck, text: '100% RERA Verified' },
              { icon: Award, text: 'Zero Brokerage' },
              { icon: Users, text: '12,500+ Happy Buyers' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/70">
                <Icon className="w-3.5 h-3.5 text-amber-400" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BUILDERS LOGOS ─────────────────────────────────────── */}
      <section className="py-16 bg-card border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              Trusted Partnerships
            </span>
            <h2 className="text-2xl font-heading font-bold text-text-primary">
              India's Tier-1 Real Estate Developers
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {builderLogos.map((builder) => (
              <div
                key={builder.name}
                onClick={() => navigate(`/properties?search=${builder.name}`)}
                className="bg-surface p-5 rounded-2xl cursor-pointer text-center space-y-2 group transition-all border border-border shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-primary"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto bg-primary-50 dark:bg-primary/15"
                >
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-heading font-bold text-xs text-text-primary">
                  {builder.name}
                </h4>
                <div className="flex items-center justify-center gap-1.5 text-[10px]">
                  <span className="text-amber-500 font-bold">{builder.rating}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-muted">{builder.projects}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ───────────────────────────────────────── */}
      <section className="py-20 bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary/15 text-primary"
              >
                Handpicked Luxury
              </span>
              <h2 className="section-title mt-3 text-text-primary">Featured Luxury Properties</h2>
              <p className="section-subtitle text-text-secondary">Prime listings handpicked for high investment ROI and world-class living.</p>
            </div>
            <Link
              to="/properties"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all self-start md:self-auto bg-card border border-border text-text-primary hover:border-primary"
            >
              View All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.slice(0, 6).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY ESTATEFLOW ────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 dark:text-amber-400"
            >
              Why EstateFlow
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary">
              The Enterprise Standard in Real Estate
            </h2>
            <p className="text-base text-text-secondary">
              Designed to eliminate opacity, delays, and friction in home buying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl p-6 space-y-4 transition-all bg-surface border border-border shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-primary"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-50 dark:bg-primary/15"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-text-primary">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-text-secondary">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STATISTICS ────────────────────────────────────────────────── */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-10 md:p-14 bg-gradient-to-r from-navy to-navy/80 dark:from-slate-900 dark:to-slate-800 border border-slate-700/50 shadow-card"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="space-y-2 px-2"
                  style={{
                    borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}
                >
                  <div
                    className="text-4xl md:text-5xl font-heading font-extrabold tracking-tight text-amber-400"
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs md:text-sm font-medium uppercase tracking-wider text-white/75"
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="py-20 bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary/15 text-primary"
            >
              Client Reviews
            </span>
            <h2 className="section-title text-text-primary">Loved by Investors &amp; Homebuyers</h2>
            <p className="section-subtitle text-text-secondary">Read what our verified buyers have to say about their EstateFlow experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-card p-6 rounded-2xl space-y-4 flex flex-col justify-between transition-all border border-border shadow-soft hover:shadow-card"
              >
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-text-secondary">"{t.text}"</p>
                </div>

                <div
                  className="flex items-center gap-3 pt-4 border-t border-border"
                >
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-heading font-bold text-sm text-text-primary">{t.name}</h4>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQS (ACCORDION) ───────────────────────────────────────────── */}
      <section className="py-20 bg-card border-t border-border transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-navy/10 text-navy dark:bg-navy/30 dark:text-sky-300"
            >
              Answers
            </span>
            <h2 className="section-title text-text-primary">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.question}
                  className={`rounded-2xl overflow-hidden transition-all border ${
                    isOpen
                      ? 'bg-surface border-primary shadow-soft'
                      : 'bg-surface-secondary/70 border-border'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-heading font-bold text-sm transition-colors text-text-primary hover:text-primary"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : 'text-text-muted'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className="px-5 pb-5 text-sm leading-relaxed text-text-secondary border-t border-border pt-3"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};
