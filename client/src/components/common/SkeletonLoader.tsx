import React from 'react';

export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-card overflow-hidden animate-pulse">
      <div className="h-60 bg-slate-800 w-full" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
        </div>
        <div className="h-6 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
        <div className="h-10 bg-slate-800 rounded-xl" />
        <div className="h-9 bg-slate-800 rounded-xl w-full" />
      </div>
    </div>
  );
};

export const PropertyGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
    <div className="h-8 bg-slate-800 rounded-xl w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-800/60 rounded-xl w-full" />
    ))}
  </div>
);

export const StatSkeleton: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="h-4 bg-slate-800 rounded w-1/3" />
    <div className="h-8 bg-slate-800 rounded w-2/3" />
    <div className="h-3 bg-slate-800 rounded w-1/2" />
  </div>
);
