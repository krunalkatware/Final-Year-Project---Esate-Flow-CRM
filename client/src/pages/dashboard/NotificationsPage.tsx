import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import { toast } from '../../contexts/ToastContext';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: profileApi.getNotifications,
  });

  const markAllReadMutation = useMutation({
    mutationFn: profileApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
  });

  return (
    <div className="bg-card rounded-3xl p-8 border border-border shadow-card space-y-6 text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Notifications Center</h2>
          <p className="text-xs text-text-secondary mt-1">Updates on your bookings, visits, and price changes</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="btn btn-outline btn-sm gap-1"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-secondary">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 text-xs ${
                notif.is_read ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-primary-50/50 border-primary/20 shadow-soft'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary text-white rounded-xl shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-sm text-text-primary">{notif.title}</h4>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-text-secondary leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-text-primary">No Notifications</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            You're all caught up! New updates regarding your property visits and bookings will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
