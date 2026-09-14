import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.api';
import { wishlistApi } from '../../api/wishlist.api';
import { profileApi } from '../../api/profile.api';
import { formatCurrency } from '../../utils/formatters';
import { 
  Calendar, 
  Heart, 
  MapPin, 
  Bell, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PersonalizedGreetingHeader } from '../../components/dashboard/PersonalizedGreetingHeader';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: bookingsApi.getMyBookings });
  const { data: wishlist = [] } = useQuery({ queryKey: ['wishlist'], queryFn: wishlistApi.getWishlist });
  const { data: siteVisits = [] } = useQuery({ queryKey: ['siteVisits'], queryFn: profileApi.getSiteVisits });
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: profileApi.getNotifications });

  const activeBookingsCount = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Personalized Greeting Header */}
      <PersonalizedGreetingHeader
        userName={user?.first_name || 'there'}
        userRole="Customer"
      />

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-3xl border border-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-primary">
            <span className="text-xs font-semibold text-text-secondary">My Bookings</span>
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-3xl font-heading font-extrabold text-text-primary">{bookings.length}</p>
          <span className="text-[11px] text-emerald-500 font-medium">{activeBookingsCount} Active</span>
        </div>

        <div className="bg-card p-5 rounded-3xl border border-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-semibold text-text-secondary">Wishlist</span>
            <Heart className="w-5 h-5" />
          </div>
          <p className="text-3xl font-heading font-extrabold text-text-primary">{wishlist.length}</p>
          <span className="text-[11px] text-text-secondary">Saved Properties</span>
        </div>

        <div className="bg-card p-5 rounded-3xl border border-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-xs font-semibold text-text-secondary">Site Visits</span>
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-3xl font-heading font-extrabold text-text-primary">{siteVisits.length}</p>
          <span className="text-[11px] text-text-secondary">Scheduled / Completed</span>
        </div>

        <div className="bg-card p-5 rounded-3xl border border-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-accent">
            <span className="text-xs font-semibold text-text-secondary">Notifications</span>
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-3xl font-heading font-extrabold text-text-primary">{notifications.filter(n => !n.is_read).length}</p>
          <span className="text-[11px] text-accent font-medium">Unread Updates</span>
        </div>
      </div>

      {/* Recent Bookings & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Bookings */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Bookings
            </h3>
            <Link to="/dashboard/bookings" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-surface border border-border flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-primary font-bold">#{b.booking_number}</span>
                    <h4 className="font-heading font-bold text-text-primary text-sm">{b.property_name}</h4>
                    <p className="text-text-secondary">{b.property_locality}, {b.property_city}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="badge badge-warning capitalize">{b.status}</span>
                    <p className="font-bold text-primary">{b.property_price ? formatCurrency(b.property_price) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-text-secondary space-y-2">
              <p>No property bookings found.</p>
              <Link to="/properties" className="btn btn-primary btn-sm inline-flex">Explore Marketplace</Link>
            </div>
          )}
        </div>

        {/* Notifications / Activity Stream */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              Recent Notifications
            </h3>
            <Link to="/dashboard/notifications" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="p-3 rounded-2xl bg-surface border border-border flex items-start gap-3 text-xs">
                  <div className="p-2 rounded-xl bg-accent-50 text-accent shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-text-primary">{n.title}</h4>
                    <p className="text-text-secondary mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-text-secondary">
              No recent notifications.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
