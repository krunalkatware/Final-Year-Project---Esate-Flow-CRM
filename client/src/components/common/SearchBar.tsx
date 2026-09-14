import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, DollarSign, ArrowRight } from 'lucide-react';

export const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budget, setBudget] = useState('');
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (propertyType) params.set('property_type', propertyType);
    if (budget) params.set('max_price', budget);
    if (search) params.set('search', search);

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white/95 backdrop-blur-xl p-3 md:p-4 rounded-3xl shadow-hover border border-white/40 max-w-4xl mx-auto space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* City Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <span className="block text-[10px] font-semibold text-text-secondary uppercase">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Delhi NCR">Delhi NCR</option>
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <Home className="w-5 h-5 text-secondary shrink-0" />
          <div className="flex-1">
            <span className="block text-[10px] font-semibold text-text-secondary uppercase">Type</span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer capitalize"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="penthouse">Penthouse</option>
              <option value="plot">Plot</option>
              <option value="studio">Studio</option>
            </select>
          </div>
        </div>

        {/* Max Budget */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <DollarSign className="w-5 h-5 text-accent shrink-0" />
          <div className="flex-1">
            <span className="block text-[10px] font-semibold text-text-secondary uppercase">Max Budget</span>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="">Any Budget</option>
              <option value="10000000">₹1 Crore</option>
              <option value="20000000">₹2 Crore</option>
              <option value="30000000">₹3 Crore</option>
              <option value="50000000">₹5 Crore+</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary h-full rounded-2xl justify-center text-sm font-semibold gap-2 shadow-soft hover:shadow-hover"
        >
          <Search className="w-4 h-4" />
          Search Properties
        </button>
      </div>
    </form>
  );
};
