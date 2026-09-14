import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Inbox,
  Search,
  Heart,
  FileText,
  Bell,
  TrendingUp,
  Users,
  Wallet,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  type?:
    | 'properties'
    | 'bookings'
    | 'visits'
    | 'notifications'
    | 'wishlist'
    | 'documents'
    | 'leads'
    | 'revenue'
    | 'wallets'
    | 'search'
    | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}

const CONFIG: Record<
  string,
  { icon: LucideIcon; title: string; description: string; color: string }
> = {
  properties: {
    icon: Building2,
    title: 'No Properties Found',
    description: 'No properties match your search. Try adjusting your filters or browse all listings.',
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  bookings: {
    icon: FileText,
    title: 'No Bookings Yet',
    description: "You haven't made any bookings yet. Explore properties and take the first step to your dream home.",
    color: 'text-secondary bg-secondary/10 border-secondary/20',
  },
  visits: {
    icon: Calendar,
    title: 'No Site Visits Scheduled',
    description: 'Schedule a site visit to experience your chosen property in person with our team.',
    color: 'text-accent bg-amber-500/10 border-amber-500/20',
  },
  notifications: {
    icon: Bell,
    title: "You're All Caught Up",
    description: "No new notifications right now. We'll alert you when something important happens.",
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  wishlist: {
    icon: Heart,
    title: 'Your Wishlist is Empty',
    description: 'Save properties you love by tapping the heart icon. Compare them anytime.',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  documents: {
    icon: FileText,
    title: 'No Documents Uploaded',
    description: 'Upload KYC documents, agreements, and payment proofs for faster processing.',
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  leads: {
    icon: Users,
    title: 'No Leads Found',
    description: 'No CRM leads match the current filters. Add a new lead to get started.',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  revenue: {
    icon: TrendingUp,
    title: 'No Revenue Data',
    description: 'Commission records will appear here once bookings are processed and approved.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  wallets: {
    icon: Wallet,
    title: 'No Wallet Activity',
    description: 'Wallet transactions will appear here after commissions are distributed.',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  search: {
    icon: Search,
    title: 'No Results Found',
    description: 'Try different keywords or adjust your search criteria.',
    color: 'text-slate-400 bg-slate-700/30 border-slate-700',
  },
  generic: {
    icon: Inbox,
    title: 'Nothing Here Yet',
    description: 'Data will appear here once available.',
    color: 'text-slate-400 bg-slate-700/30 border-slate-700',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) => {
  const config = CONFIG[type] || CONFIG.generic;
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDesc = description || config.description;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center space-y-5 ${className}`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${config.color}`}
      >
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-bold text-base text-white">{displayTitle}</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{displayDesc}</p>
      </div>

      {(actionLabel && (actionTo || onAction)) && (
        <>
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition shadow-glow-primary"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition shadow-glow-primary"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
};
