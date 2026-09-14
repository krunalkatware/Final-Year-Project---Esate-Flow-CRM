import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PropertyListItem } from '../../types/property';
import { Heart, MapPin, Bed, Bath, Maximize, Star, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency, calculateEMI } from '../../utils/formatters';

interface PropertyCardProps {
  property: PropertyListItem;
  onCompareToggle?: (property: PropertyListItem) => void;
  isCompared?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onCompareToggle,
  isCompared = false,
}) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  const wishlisted = isWishlisted(property.id) || property.is_wishlisted;
  const emi = calculateEMI(property.price);

  return (
    <div className="group bg-card text-text-primary rounded-2xl border border-border shadow-card hover:shadow-hover transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Header */}
      <div className="relative h-60 w-full overflow-hidden bg-surface-secondary">
        <img
          src={property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-white/90 backdrop-blur-md text-text-primary shadow-sm">
            {property.property_type}
          </span>
          {property.is_featured && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent text-white shadow-sm flex items-center gap-1">
              ★ Featured
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(property.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
            wishlisted
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/80 text-gray-700 hover:bg-white hover:text-red-500 hover:scale-110'
          }`}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Price & EMI Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <div className="text-xl font-heading font-extrabold tracking-tight">
              {formatCurrency(property.price)}
            </div>
            <div className="text-xs text-white/80 font-light">
              EST. EMI: {formatCurrency(emi)}/mo
            </div>
          </div>
          {property.expected_roi && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/90 backdrop-blur-sm text-white">
              {property.expected_roi}% Expected ROI
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Builder & Status */}
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span className="font-medium text-primary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              {property.builder_name || 'Enterprise Builder'}
            </span>
            <span className="capitalize px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium text-slate-700">
              {property.status}
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block group-hover:text-primary transition-colors">
            <h3 className="font-heading font-bold text-lg text-text-primary line-clamp-1">
              {property.name}
            </h3>
          </Link>

          {/* Location */}
          <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.locality}, {property.city}</span>
          </p>
        </div>

        {/* Key Features Pill Bar */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl text-xs text-text-primary border border-slate-100">
          {property.bedrooms ? (
            <div className="flex items-center gap-1.5 justify-center">
              <Bed className="w-4 h-4 text-primary" />
              <span className="font-semibold">{property.bedrooms} BHK</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 justify-center">
              <Bed className="w-4 h-4 text-primary" />
              <span className="font-semibold">Plot</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 justify-center border-x border-slate-200">
            <Bath className="w-4 h-4 text-secondary" />
            <span className="font-semibold">{property.bathrooms || 1} Bath</span>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <Maximize className="w-4 h-4 text-accent" />
            <span className="font-semibold">{property.area_sqft || 0} sqft</span>
          </div>
        </div>

        {/* Possession & Rating info */}
        <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {property.possession_date || 'Ready'}
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Star className="w-3.5 h-3.5 fill-current" />
            {property.rating} ({property.review_count})
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2 border-t border-border">
          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(property)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                isCompared
                  ? 'bg-primary-50 border-primary text-primary font-semibold'
                  : 'border-border text-text-secondary hover:bg-slate-50'
              }`}
            >
              {isCompared ? 'Compared' : '+ Compare'}
            </button>
          )}

          <Link
            to={`/properties/${property.id}`}
            className="flex-1 btn btn-primary btn-sm justify-center gap-1 shadow-soft"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
