import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import { toast } from '../../contexts/ToastContext';
import { MapPin, Calendar, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SiteVisitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['siteVisits'],
    queryFn: profileApi.getSiteVisits,
  });

  const cancelMutation = useMutation({
    mutationFn: profileApi.cancelSiteVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
      toast.success('Site visit cancelled.');
    },
  });

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6 text-text-primary">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">My Scheduled Site Visits</h2>
          <p className="text-xs text-text-secondary mt-1">Manage physical and virtual property walk-throughs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-secondary">Loading site visits...</div>
      ) : visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-soft"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={visit.property_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                  alt={visit.property_name}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0"
                />
                <div className="space-y-1">
                  <span className={`badge capitalize text-[10px] ${
                    visit.status === 'scheduled' ? 'badge-primary' : visit.status === 'completed' ? 'badge-success' : 'badge-error'
                  }`}>
                    {visit.status}
                  </span>
                  <h3 className="font-heading font-bold text-base text-text-primary">{visit.property_name}</h3>
                  <p className="text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {visit.property_locality}, {visit.property_city}
                  </p>
                  <p className="text-secondary font-semibold flex items-center gap-1 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(visit.visit_date).toLocaleDateString()} ({visit.time_slot})
                  </p>
                </div>
              </div>

              {visit.status === 'scheduled' && (
                <button
                  onClick={() => cancelMutation.mutate(visit.id)}
                  disabled={cancelMutation.isPending}
                  className="btn btn-outline btn-sm text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Visit
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <Calendar className="w-12 h-12 text-text-muted mx-auto opacity-50" />
          <h3 className="font-heading font-bold text-lg text-text-primary">No Site Visits Scheduled</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Schedule a free private site visit with our relationship officer.
          </p>
          <Link to="/properties" className="btn btn-primary btn-sm inline-flex">
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
};
