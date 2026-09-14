import React from 'react';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize, Trash2, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist = [], isLoading, removeFromWishlist } = useWishlist();

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6 text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Saved Properties Wishlist</h2>
          <p className="text-xs text-text-secondary mt-1">Your saved luxury listings for future reference</p>
        </div>
        <span className="badge badge-primary font-semibold text-xs">{wishlist.length} Items</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-secondary">Loading saved properties...</div>
      ) : wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-2xl border border-border shadow-soft hover:shadow-card transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-surface-secondary">
                  <img
                    src={item.property_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                    alt={item.property_name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFromWishlist(item.property_id)}
                    className="absolute top-3 right-3 p-2 bg-card/90 text-rose-500 rounded-full shadow-sm hover:scale-110 transition-transform"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-bold text-base text-text-primary line-clamp-1">
                    {item.property_name}
                  </h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {item.property_locality}, {item.property_city}
                  </p>
                  <div className="text-lg font-heading font-extrabold text-primary pt-1">
                    {item.property_price ? formatCurrency(item.property_price) : ''}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border mt-3 flex items-center justify-between">
                <Link
                  to={`/properties/${item.property_id}`}
                  className="btn btn-primary btn-sm w-full justify-center gap-1"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-text-primary">Your Wishlist is Empty</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Save your favorite luxury properties to easily compare and book later.
          </p>
          <Link to="/properties" className="btn btn-primary btn-sm inline-flex">
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
};
