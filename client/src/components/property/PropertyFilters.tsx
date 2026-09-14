import React from 'react';
import { PropertyFilterParams } from '../../types/property';
import { Filter, RotateCcw, Search, Building, Home, MapPin, DollarSign } from 'lucide-react';

interface PropertyFiltersProps {
  filters: PropertyFilterParams;
  onFilterChange: (filters: PropertyFilterParams) => void;
  onReset: () => void;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const cities = ['Mumbai', 'Pune', 'Bangalore', 'Hyderabad', 'Delhi NCR'];
  const propertyTypes = ['apartment', 'villa', 'penthouse', 'plot', 'studio'];
  const bhkOptions = [1, 2, 3, 4];
  const statuses = ['available', 'reserved', 'booked'];

  const handleChange = (key: keyof PropertyFilterParams, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? undefined : value,
      page: 1, // reset page on filter change
    });
  };

  return (
    <div className="bg-card text-text-primary rounded-2xl border border-border p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-heading font-bold text-lg flex items-center gap-2 text-text-primary">
          <Filter className="w-5 h-5 text-primary" />
          Filter Properties
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-text-secondary hover:text-primary flex items-center gap-1 font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* Search keyword */}
      <div>
        <label className="label">Keyword / Locality</label>
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, area, builder..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="label flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" />
          City
        </label>
        <select
          value={filters.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          className="input"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Home className="w-4 h-4 text-secondary" />
          Property Type
        </label>
        <select
          value={filters.property_type || ''}
          onChange={(e) => handleChange('property_type', e.target.value)}
          className="input capitalize"
        >
          <option value="">All Types</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type} className="capitalize">{type}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="label">Bedrooms (BHK)</label>
        <div className="grid grid-cols-4 gap-2">
          {bhkOptions.map((bhk) => (
            <button
              key={bhk}
              type="button"
              onClick={() => handleChange('bedrooms', filters.bedrooms === bhk ? undefined : bhk)}
              className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                filters.bedrooms === bhk
                  ? 'bg-primary text-white border-primary shadow-soft'
                  : 'bg-surface border-border text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {bhk} {bhk === 4 ? '+' : ''} BHK
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="label flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-accent" />
          Budget Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.min_price || ''}
            onChange={(e) => handleChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-xs"
          >
            <option value="">Min Budget</option>
            <option value="5000000">₹50 Lakh</option>
            <option value="10000000">₹1 Crore</option>
            <option value="20000000">₹2 Crore</option>
            <option value="30000000">₹3 Crore</option>
          </select>
          <select
            value={filters.max_price || ''}
            onChange={(e) => handleChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-xs"
          >
            <option value="">Max Budget</option>
            <option value="10000000">₹1 Crore</option>
            <option value="20000000">₹2 Crore</option>
            <option value="30000000">₹3 Crore</option>
            <option value="50000000">₹5 Crore+</option>
          </select>
        </div>
      </div>

      {/* Availability Status */}
      <div>
        <label className="label">Availability Status</label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChange('status', filters.status === status ? undefined : status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize border transition-all ${
                filters.status === status
                  ? 'bg-primary text-white border-primary shadow-soft font-bold'
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
