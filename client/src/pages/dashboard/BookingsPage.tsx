import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.api';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../contexts/ToastContext';
import { Calendar, MapPin, Clock, Trash2, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BookingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully.');
      setConfirmCancelId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking.');
      setConfirmCancelId(null);
    },
  });

  const bookingToCancel = bookings.find((b) => b.id === confirmCancelId);

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6 text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">My Property Bookings</h2>
          <p className="text-xs text-text-secondary mt-1">Track reservation status and scheduled site visits</p>
        </div>
        <Link to="/properties" className="btn btn-primary btn-sm gap-1">
          + Book New Property
        </Link>
      </div>

      {/* Inline Cancel Confirmation Modal */}
      {confirmCancelId !== null && bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl shadow-hover p-8 max-w-md w-full space-y-5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-text-primary">Cancel Booking?</h3>
                <p className="text-xs text-text-secondary mt-1">
                  You're about to cancel booking{' '}
                  <span className="font-mono font-bold text-primary">#{bookingToCancel.booking_number}</span> for{' '}
                  <span className="font-semibold text-text-primary">{bookingToCancel.property_name}</span>.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface border border-border text-xs text-text-secondary space-y-1">
              <p>• Token amount (if paid) is non-refundable after cancellation.</p>
              <p>• The property may be re-listed for other buyers.</p>
              <p>• You can rebook the same property at any time.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmCancelId(null)}
                disabled={cancelMutation.isPending}
                className="btn btn-outline btn-sm flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Keep Booking
              </button>
              <button
                onClick={() => cancelMutation.mutate(confirmCancelId!)}
                disabled={cancelMutation.isPending}
                className="btn btn-sm flex-1 bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-secondary">Loading your bookings...</div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft"
            >
              <div className="flex gap-4">
                <img
                  src={booking.property_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                  alt={booking.property_name}
                  className="w-24 h-24 rounded-2xl object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=60';
                  }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">#{booking.booking_number}</span>
                    <span className={`badge capitalize text-[10px] ${
                      booking.status === 'confirmed' ? 'badge-success' :
                      booking.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-text-primary">{booking.property_name}</h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {booking.property_locality}, {booking.property_city}
                  </p>
                  {booking.preferred_visit_date && (
                    <p className="text-xs text-secondary font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled Visit: {new Date(booking.preferred_visit_date).toLocaleDateString()} ({booking.visit_time_slot})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                <div className="text-right">
                  <span className="text-[10px] text-text-secondary uppercase">Listed Price</span>
                  <p className="font-heading font-bold text-lg text-primary">
                    {booking.property_price ? formatCurrency(booking.property_price) : 'Contact Advisor'}
                  </p>
                </div>

                {booking.status !== 'cancelled' && (
                  <button
                    onClick={() => setConfirmCancelId(booking.id)}
                    disabled={cancelMutation.isPending && confirmCancelId === booking.id}
                    className="btn btn-outline btn-sm text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel Booking
                  </button>
                )}

                {booking.status === 'cancelled' && (
                  <span className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                    ✕ Booking Cancelled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <Calendar className="w-12 h-12 text-text-muted mx-auto opacity-50" />
          <h3 className="font-heading font-bold text-lg text-text-primary">No Bookings Yet</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            You haven't reserved or requested site visits for any property yet.
          </p>
          <Link to="/properties" className="btn btn-primary btn-sm inline-flex">
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
};
