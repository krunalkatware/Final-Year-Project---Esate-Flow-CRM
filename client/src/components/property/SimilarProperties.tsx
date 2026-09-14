import React, { useEffect, useState } from 'react';
import { PropertyListItem } from '../../types/property';
import { propertiesApi } from '../../api/properties.api';
import { PropertyCard } from './PropertyCard';
import { Sparkles, Building2 } from 'lucide-react';

interface SimilarPropertiesProps {
  currentPropertyId: number | string;
}

export const SimilarProperties: React.FC<SimilarPropertiesProps> = ({ currentPropertyId }) => {
  const [similarList, setSimilarList] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    propertiesApi
      .getSimilarProperties(currentPropertyId)
      .then((data) => {
        if (isMounted) {
          setSimilarList(data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch similar properties:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPropertyId]);

  if (!isLoading && similarList.length === 0) return null;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Handpicked Recommendations</span>
          <h2 className="font-heading font-bold text-2xl text-text-primary flex items-center gap-2 mt-1">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Similar Luxury Properties
          </h2>
        </div>
        <p className="text-xs text-text-secondary">
          Matching same city, builder prestige & budget range
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarList.slice(0, 6).map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
};
