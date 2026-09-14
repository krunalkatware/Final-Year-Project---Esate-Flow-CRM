import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyDetail } from '../../hooks/useProperties';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../contexts/AuthContext';
import { EMICalculator } from '../../components/property/EMICalculator';
import { BookingWizard } from '../../components/booking/BookingWizard';
import { LightboxModal } from '../../components/property/LightboxModal';
import { PropertyHighlights } from '../../components/property/PropertyHighlights';
import { PropertyLocationMap } from '../../components/property/PropertyLocationMap';
import { PropertyDocuments } from '../../components/property/PropertyDocuments';
import { SimilarProperties } from '../../components/property/SimilarProperties';
import { SiteVisitModal } from '../../components/property/SiteVisitModal';
import { PropertyShareModal } from '../../components/property/PropertyShareModal';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../contexts/ToastContext';
import { reviewsApi } from '../../api/reviews.api';
import { Review } from '../../types/booking';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Star, 
  Calendar, 
  ShieldCheck, 
  Heart, 
  Share2, 
  Download, 
  Building2, 
  Check, 
  ArrowLeft,
  Sparkles,
  PhoneCall,
  Compass,
  Layers,
  Send,
  User as UserIcon,
  Maximize2,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const { data: property, isLoading, error } = usePropertyDetail(id || '');

  // Modals & Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [showBookingWizard, setShowBookingWizard] = useState<boolean>(false);
  const [showSiteVisitModal, setShowSiteVisitModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Reviews State
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);

  // Fetch Reviews when property loads
  useEffect(() => {
    if (property?.id) {
      setIsLoadingReviews(true);
      reviewsApi
        .getPropertyReviews(property.id)
        .then((res) => setReviewsList(res || []))
        .catch((err) => console.error('Failed to load reviews:', err))
        .finally(() => setIsLoadingReviews(false));
    }
  }, [property?.id]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 animate-pulse space-y-8">
        <div className="h-96 bg-gray-200 rounded-3xl" />
        <div className="h-20 bg-gray-200 rounded-2xl w-2/3" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="pt-32 pb-16 max-w-md mx-auto px-4 text-center space-y-4">
        <h2 className="font-heading font-bold text-2xl">Property Not Found</h2>
        <button onClick={() => navigate('/properties')} className="btn btn-primary btn-sm">
          Return to Marketplace
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(property.id) || property.is_wishlisted;

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to submit a review.');
      navigate('/login');
      return;
    }

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error('Please provide both a title and review comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewsApi.createReview({
        property_id: property.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast.success('Thank you! Your review has been published.');
      setReviewTitle('');
      setReviewComment('');

      // Refresh reviews list
      const updated = await reviewsApi.getPropertyReviews(property.id);
      setReviewsList(updated || []);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/properties')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
          <div className="text-xs text-text-secondary">
            {property.city?.name} • {property.locality} • <span className="font-semibold text-text-primary">{property.name}</span>
          </div>
        </div>

        {/* Gallery & Title Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="badge badge-primary uppercase text-[10px] tracking-wider">{property.property_type}</span>
                <span className="badge badge-success capitalize text-[10px] font-semibold">{property.status}</span>
                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {property.rating} ({property.review_count} Reviews)
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> RERA: {property.rera_number || 'P51900028491'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary mt-2">
                {property.name}
              </h1>

              <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                {property.full_address || `${property.locality}, ${property.city?.name}`}
                {property.builder && (
                  <span className="text-xs font-medium text-slate-500 ml-2">
                    by <span className="text-text-primary font-semibold">{property.builder.name}</span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleWishlist(property.id)}
                className={`btn btn-outline btn-sm gap-1.5 transition-all ${
                  wishlisted ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current text-red-500' : ''}`} />
                {wishlisted ? 'Saved' : 'Wishlist'}
              </button>
              <button onClick={handleShare} className="btn btn-outline btn-sm gap-1.5">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Hero Gallery Grid + Fullscreen Lightbox Trigger */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[420px]">
            {/* Main Big Image */}
            <div 
              onClick={() => setShowLightbox(true)}
              className="md:col-span-3 rounded-3xl overflow-hidden shadow-card relative group bg-slate-900 cursor-pointer"
            >
              <img
                src={property.images?.[activeImageIndex]?.url || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'}
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              
              {/* Image Overlay Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700">
                  {property.images?.[activeImageIndex]?.caption || `Photo ${activeImageIndex + 1} of ${property.images?.length || 1}`}
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLightbox(true);
                  }}
                  className="pointer-events-auto bg-white/90 hover:bg-white text-slate-900 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  Fullscreen Gallery
                </button>
              </div>
            </div>

            {/* Side Thumbnail Strip */}
            <div className="hidden md:flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
              {property.images?.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-24 rounded-2xl overflow-hidden border-2 transition-all relative ${
                    activeImageIndex === idx 
                      ? 'border-primary ring-2 ring-primary/30 scale-95 opacity-100' 
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Grid: Left Content (2/3) + Sticky Right Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Key Specs Banner */}
            <div className="bg-card rounded-3xl p-6 border border-border shadow-card grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-xs text-text-secondary font-medium">BHK Configuration</span>
                <p className="font-heading font-bold text-lg text-text-primary flex items-center justify-center gap-1.5 mt-1">
                  <Bed className="w-5 h-5 text-primary" />
                  {property.bedrooms ? `${property.bedrooms} BHK` : '3 BHK'}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-medium">Carpet / Built-up</span>
                <p className="font-heading font-bold text-lg text-text-primary flex items-center justify-center gap-1.5 mt-1">
                  <Maximize className="w-5 h-5 text-secondary" />
                  {property.carpet_area || roundSqft(property.area_sqft, 0.82)} sqft
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-medium">Bathrooms</span>
                <p className="font-heading font-bold text-lg text-text-primary flex items-center justify-center gap-1.5 mt-1">
                  <Bath className="w-5 h-5 text-accent" />
                  {property.bathrooms || 3} Bath
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-medium">Possession Status</span>
                <p className="font-heading font-bold text-lg text-text-primary flex items-center justify-center gap-1.5 mt-1">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  {property.possession_date || 'Ready To Move'}
                </p>
              </div>
            </div>

            {/* Description & Overview */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-heading font-bold text-xl text-text-primary">
                  About {property.name}
                </h2>
                <span className="badge badge-outline text-xs">Project: {property.project_name || `${property.name} Enclave`}</span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed font-light">
                {property.description || `${property.name} offers ultra-luxurious residential living in prime ${property.locality}, ${property.city?.name}. Crafted with architectural precision, top-of-the-line Italian finishes, expansive balconies, and floor-to-ceiling panoramic glass windows.`}
              </p>

              {/* Extended Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
                <div className="p-3 bg-surface-secondary rounded-2xl border border-border">
                  <span className="text-text-secondary">Floor Height:</span>
                  <p className="font-bold text-text-primary mt-0.5">Floor {property.floor_number || 12} of {property.total_floors || 24}</p>
                </div>
                <div className="p-3 bg-surface-secondary rounded-2xl border border-border">
                  <span className="text-text-secondary">Facing Direction:</span>
                  <p className="font-bold text-text-primary mt-0.5">{property.facing || 'East Facing'}</p>
                </div>
                <div className="p-3 bg-surface-secondary rounded-2xl border border-border">
                  <span className="text-text-secondary">Furnishing Status:</span>
                  <p className="font-bold text-text-primary mt-0.5">{property.furnishing || 'Semi-Furnished'}</p>
                </div>
                <div className="p-3 bg-surface-secondary rounded-2xl border border-border">
                  <span className="text-text-secondary">Parking Allocation:</span>
                  <p className="font-bold text-text-primary mt-0.5">{property.parking_spots || 2} Covered Spots</p>
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Premium Club & Project Amenities
                </h2>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  10+ World-Class Facilities
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {property.amenity_names?.map((name) => (
                  <div 
                    key={name} 
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-secondary border border-border text-xs font-semibold text-text-primary hover:border-primary/40 transition-colors"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Highlights */}
            <PropertyHighlights highlights={property.highlights} />

            {/* EMI Calculator */}
            <EMICalculator propertyPrice={property.price} />

            {/* Builder Profile Section */}
            {property.builder && (
              <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={property.builder.logo_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80'}
                      alt={property.builder.name}
                      className="w-14 h-14 object-cover rounded-2xl border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                        {property.builder.name}
                        {property.builder.is_verified && (
                          <span title="Verified Developer">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        Established {property.builder.established_year || 1995} • Headquarters: {property.builder.headquarters || 'Mumbai'}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-success font-semibold text-xs w-fit">
                    ★ {property.builder.rating || 4.7} Rating
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed font-light">
                  {property.builder.description || `${property.builder.name} is one of India's premier developers with over ${property.builder.delivered_projects}+ delivered landmarks.`}
                </p>

                <div className="grid grid-cols-3 gap-4 p-4 bg-surface-secondary rounded-2xl text-center text-xs border border-border">
                  <div>
                    <span className="text-text-secondary">Delivered Projects</span>
                    <p className="font-bold text-text-primary text-sm mt-0.5">{property.builder.delivered_projects || 38}+</p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Ongoing Projects</span>
                    <p className="font-bold text-text-primary text-sm mt-0.5">{(property.builder.total_projects || 45) - (property.builder.delivered_projects || 38)}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Years Experience</span>
                    <p className="font-bold text-primary text-sm mt-0.5">{new Date().getFullYear() - (property.builder.established_year || 1995)} Yrs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Map Section */}
            <PropertyLocationMap
              locality={property.locality}
              city={property.city?.name}
              fullAddress={property.full_address}
              latitude={property.latitude}
              longitude={property.longitude}
              nearbyLocations={property.nearby_locations}
            />

            {/* Downloadable Documents */}
            <PropertyDocuments propertyName={property.name} documents={property.documents} />

            {/* Interactive EMI Calculator */}
            <EMICalculator propertyPrice={property.price} />

            {/* Customer Reviews & Form */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                    Customer Reviews & Feedback
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Verified resident and buyer experiences for {property.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-heading font-bold text-2xl text-amber-600">{property.rating}</span>
                  <span className="text-xs text-text-secondary block">/ 5.0 Rating</span>
                </div>
              </div>

              {/* Reviews List */}
              {isLoadingReviews ? (
                <div className="py-4 text-center text-xs text-text-secondary animate-pulse">
                  Loading resident reviews...
                </div>
              ) : reviewsList.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-surface-secondary border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center text-xs uppercase">
                            {rev.reviewer_avatar ? (
                              <img src={rev.reviewer_avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              rev.reviewer_name?.slice(0, 2) || 'US'
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">{rev.reviewer_name || 'Verified Buyer'}</span>
                            <span className="text-[10px] text-text-secondary">{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>

                      {rev.title && <h4 className="font-bold text-text-primary">{rev.title}</h4>}
                      <p className="text-text-secondary leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic py-2">
                  No customer reviews yet. Be the first to leave a review for this property!
                </p>
              )}

              {/* Submit Review Form */}
              <form onSubmit={handleReviewSubmit} className="bg-surface-secondary p-5 rounded-2xl border border-border space-y-4">
                <h4 className="font-heading font-bold text-sm text-text-primary">Leave Your Rating & Review</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`p-1 transition-transform hover:scale-125 ${
                          star <= reviewRating ? 'text-amber-500' : 'text-text-muted'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Review Title (e.g. Excellent Construction & Prime Location)..."
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="input text-xs"
                />

                <textarea
                  rows={3}
                  placeholder="Share your detailed experience regarding amenities, location accessibility, builder quality..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="input text-xs"
                />

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Similar Properties Component */}
            <SimilarProperties currentPropertyId={property.id} />

          </div>

          {/* Right Column (Sticky Instant Booking CTA Sidebar) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 bg-card rounded-3xl p-6 border border-border shadow-hover space-y-6">
              
              {/* Pricing Box */}
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">All Inclusive Price</span>
                <div className="text-3xl font-heading font-extrabold text-primary">
                  {formatCurrency(property.price)}
                </div>
                <div className="text-xs text-text-secondary flex items-center justify-between pt-1">
                  <span>₹{property.price_per_sqft || Math.round(property.price / (property.area_sqft || 1000))}/sqft</span>
                  <span className="text-emerald-600 font-semibold">Zero Brokerage</span>
                </div>
              </div>

              {/* Instant Action CTA Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please log in to book this property');
                      navigate('/login');
                      return;
                    }
                    setShowBookingWizard(true);
                  }}
                  className="btn btn-primary w-full btn-lg justify-center gap-2 shadow-soft hover:shadow-hover"
                >
                  <Building2 className="w-5 h-5" />
                  Book Property Request
                </button>

                <button
                  onClick={() => setShowSiteVisitModal(true)}
                  className="btn btn-secondary w-full btn-lg justify-center gap-2 shadow-soft hover:border-primary/50"
                >
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule VIP Site Visit
                </button>
              </div>

              {/* Direct Relationship Officer Assistance */}
              <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-text-primary">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  Dedicated Relationship Officer
                </div>
                <p className="text-text-secondary">Instant assistance & VIP site visit pick-up available.</p>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href="tel:+919876543210"
                    className="font-mono text-xs font-bold text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    +91 98765 43210
                  </a>
                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi, I am interested in ${property.name} (ID: #${property.id}) priced at ${formatCurrency(property.price)}. Please share the brochure and floor plan.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Guarantee */}
              <div className="flex items-center gap-2 text-[11px] text-text-secondary justify-center border-t border-border pt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>RERA Verified • Lowest Price Match Guarantee</span>
              </div>

            </div>
          </aside>

        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && property.images && (
        <LightboxModal
          images={property.images}
          initialIndex={activeImageIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Property Booking Request Wizard Modal */}
      {showBookingWizard && (
        <BookingWizard
          property={property}
          onClose={() => setShowBookingWizard(false)}
        />
      )}

      {/* VIP Site Visit Booking Modal */}
      {showSiteVisitModal && (
        <SiteVisitModal
          property={property}
          onClose={() => setShowSiteVisitModal(false)}
        />
      )}
      {/* Property Share & QR Code Modal */}
      <PropertyShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        propertyName={property.name}
        propertyId={property.id}
      />
    </div>
  );
};

function roundSqft(area?: number, multiplier: number = 0.82): number {
  if (!area) return 1250;
  return Math.round(area * multiplier);
}
