import React, { useState } from 'react';
import { 
  MapPin, 
  School, 
  Hospital, 
  Train, 
  Plane, 
  ShoppingBag, 
  Navigation,
  Compass
} from 'lucide-react';

interface NearbyPlace {
  category: string;
  name: string;
  distance: string;
}

interface PropertyLocationMapProps {
  locality?: string;
  city?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  nearbyLocations?: NearbyPlace[];
}

export const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  locality = 'Bandra West',
  city = 'Mumbai',
  fullAddress,
  latitude = 19.0596,
  longitude = 72.8295,
  nearbyLocations,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const defaultNearby: NearbyPlace[] = [
    { category: 'School', name: 'Delhi Public School & St. Xavier International', distance: '1.2 km' },
    { category: 'Hospital', name: 'Apollo Super Speciality & Fortis Healthcare', distance: '2.5 km' },
    { category: 'Metro', name: 'Line 3 Express Metro Station (Central Loop)', distance: '0.8 km' },
    { category: 'Airport', name: 'Chhatrapati Shivaji Intl Airport Terminal 2', distance: '12.4 km' },
    { category: 'Mall', name: 'Phoenix Palladium & Marketcity Luxury Hub', distance: '3.1 km' },
  ];

  const places = nearbyLocations && nearbyLocations.length > 0 ? nearbyLocations : defaultNearby;

  const categories = ['All', 'School', 'Hospital', 'Metro', 'Airport', 'Mall'];

  const filteredPlaces = activeCategory === 'All' 
    ? places 
    : places.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'school':
        return <School className="w-4 h-4 text-blue-600" />;
      case 'hospital':
        return <Hospital className="w-4 h-4 text-rose-600" />;
      case 'metro':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'airport':
        return <Plane className="w-4 h-4 text-amber-600" />;
      case 'mall':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      default:
        return <Navigation className="w-4 h-4 text-primary" />;
    }
  };

  // OpenStreetMap embed URL
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.02}%2C${latitude - 0.02}%2C${longitude + 0.02}%2C${latitude + 0.02}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className="bg-card text-text-primary rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Location & Micro-Market Insights
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {fullAddress || `${locality}, ${city}`}
          </p>
        </div>
        <span className="badge badge-success text-[10px] font-semibold flex items-center gap-1 w-fit">
          <MapPin className="w-3 h-3" /> Prime Neighborhood
        </span>
      </div>

      {/* Embed Map Iframe */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm h-72 sm:h-80 bg-surface-secondary group">
        <iframe
          title="Property Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmUrl}
          className="w-full h-full grayscale-[20%] contrast-[1.05] group-hover:grayscale-0 transition-all duration-500"
        />

        {/* Map Header Overlay */}
        <div className="absolute top-3 left-3 bg-navy/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-border/60 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary animate-bounce" />
          <span className="font-semibold">{locality}, {city}</span>
        </div>
      </div>

      {/* Nearby Amenities & Infrastructure */}
      <div className="space-y-4 pt-2">
        <h3 className="font-heading font-bold text-base text-text-primary">
          Nearby Landmarks & Infrastructure
        </h3>

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Nearby Places Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPlaces.map((place, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border text-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-surface-secondary shadow-xs border border-border">
                  {getCategoryIcon(place.category)}
                </div>
                <div>
                  <span className="font-bold text-text-primary block">{place.name}</span>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                    {place.category}
                  </span>
                </div>
              </div>

              <span className="bg-surface-secondary border border-border text-primary font-bold text-xs px-2.5 py-1 rounded-xl shrink-0">
                {place.distance}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
