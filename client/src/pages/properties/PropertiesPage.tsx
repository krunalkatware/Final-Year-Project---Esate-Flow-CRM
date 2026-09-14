import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PropertyFilters } from '../../components/property/PropertyFilters';
import { PropertyCard } from '../../components/property/PropertyCard';
import { PropertyGridSkeleton } from '../../components/common/SkeletonLoader';
import { useProperties } from '../../hooks/useProperties';
import { PropertyFilterParams, PropertyListItem } from '../../types/property';
import { LayoutGrid, List, SlidersHorizontal, ArrowLeftRight, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [comparedProperties, setComparedProperties] = useState<PropertyListItem[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Initialize filters from URL query params
  const [filters, setFilters] = useState<PropertyFilterParams>({
    city: searchParams.get('city') || undefined,
    property_type: searchParams.get('property_type') || undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    search: searchParams.get('search') || undefined,
    page: 1,
    limit: 9,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const { data, isLoading } = useProperties(filters);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.property_type) params.set('property_type', filters.property_type);
    if (filters.max_price) params.set('max_price', String(filters.max_price));
    if (filters.search) params.set('search', filters.search);
    setSearchParams(params);
  }, [filters]);

  const handleCompareToggle = (property: PropertyListItem) => {
    if (comparedProperties.some((p) => p.id === property.id)) {
      setComparedProperties((prev) => prev.filter((p) => p.id !== property.id));
    } else {
      if (comparedProperties.length >= 3) {
        alert('You can compare a maximum of 3 properties at a time.');
        return;
      }
      setComparedProperties((prev) => [...prev, property]);
    }
  };

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="badge badge-primary uppercase text-[10px]">Marketplace</span>
            <h1 className="text-3xl font-heading font-extrabold text-text-primary mt-1">
              Explore Enterprise Real Estate
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {data ? `Showing ${data.total} verified luxury properties` : 'Loading properties...'}
            </p>
          </div>

          {/* Sort & View Mode controls */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-1.5 shadow-soft">
              <span className="text-xs text-text-secondary font-medium">Sort:</span>
              <select
                value={`${filters.sort_by}_${filters.sort_order}`}
                onChange={(e) => {
                  const [sort_by, sort_order] = e.target.value.split('_');
                  setFilters((prev) => ({ ...prev, sort_by, sort_order: sort_order as any }));
                }}
                className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="created_at_desc">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-card border border-border rounded-2xl p-1 shadow-soft">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-primary text-white shadow-soft' : 'text-slate-400 hover:text-text-primary'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-primary text-white shadow-soft' : 'text-slate-400 hover:text-text-primary'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <PropertyFilters
              filters={filters}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              onReset={() =>
                setFilters({ page: 1, limit: 9, sort_by: 'created_at', sort_order: 'desc' })
              }
            />
          </aside>

          {/* Properties Grid */}
          <main className="lg:col-span-3 space-y-8">
            {isLoading ? (
              <PropertyGridSkeleton count={6} />
            ) : data && data.items.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'flex flex-col gap-6'
                  }
                >
                  {data.items.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onCompareToggle={handleCompareToggle}
                      isCompared={comparedProperties.some((p) => p.id === property.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                      className="btn btn-outline btn-sm disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {Array.from({ length: data.pages }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                            filters.page === pageNum
                              ? 'bg-primary text-white shadow-soft'
                              : 'bg-card border border-border text-text-primary hover:bg-surface-secondary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={filters.page === data.pages}
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                      className="btn btn-outline btn-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-card rounded-3xl p-12 text-center border border-border space-y-4 shadow-soft">
                <SlidersHorizontal className="w-12 h-12 text-text-muted opacity-40 mx-auto" />
                <h3 className="font-heading font-bold text-xl text-text-primary">No Properties Found</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Try adjusting your city, budget, or bedroom filters to explore more properties.
                </p>
                <button
                  onClick={() => setFilters({ page: 1, limit: 9, sort_by: 'created_at', sort_order: 'desc' })}
                  className="btn btn-primary btn-sm"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>

        </div>

      </div>

      {/* Floating Compare Drawer */}
      {comparedProperties.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-card text-text-primary p-4 rounded-3xl shadow-hover border border-border flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold">{comparedProperties.length} Properties Selected</span>
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="btn btn-accent btn-sm"
          >
            Compare Now
          </button>
          <button
            onClick={() => setComparedProperties([])}
            className="p-1 rounded-full hover:bg-surface-secondary text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-card text-text-primary w-full max-w-5xl rounded-3xl shadow-hover p-6 border border-border space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                Property Comparison Matrix
              </h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-full hover:bg-surface-secondary text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedProperties.map((prop) => (
                <div key={prop.id} className="bg-surface rounded-2xl p-4 border border-border space-y-3 text-xs shadow-soft">
                  <img src={prop.primary_image} alt={prop.name} className="w-full h-36 object-cover rounded-xl" />
                  <h3 className="font-heading font-bold text-base text-text-primary">{prop.name}</h3>
                  <p className="text-primary font-bold text-sm">{formatCurrency(prop.price)}</p>
                  <div className="space-y-1 text-text-secondary border-t border-border pt-2">
                    <p><strong>City:</strong> {prop.city}</p>
                    <p><strong>Type:</strong> {prop.property_type}</p>
                    <p><strong>BHK:</strong> {prop.bedrooms || 'N/A'}</p>
                    <p><strong>Area:</strong> {prop.area_sqft} sqft</p>
                    <p><strong>Builder:</strong> {prop.builder_name}</p>
                    <p><strong>Rating:</strong> ★ {prop.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
