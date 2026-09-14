import React from 'react';
import { 
  Compass, 
  Square, 
  Cpu, 
  Sparkles, 
  ChefHat, 
  Sun, 
  CheckCircle2 
} from 'lucide-react';

interface HighlightItem {
  icon?: string;
  title: string;
  description: string;
}

interface PropertyHighlightsProps {
  highlights?: HighlightItem[];
}

export const PropertyHighlights: React.FC<PropertyHighlightsProps> = ({ highlights }) => {
  const defaultHighlights = [
    {
      icon: 'Compass',
      title: 'East Facing',
      description: 'Abundant natural morning light & optimal ventilation',
      badge: 'Vastu Advantage',
    },
    {
      icon: 'Square',
      title: 'Corner Plot',
      description: 'Maximum privacy with dual wide-road access',
      badge: 'Exclusive Placement',
    },
    {
      icon: 'Cpu',
      title: 'Smart Home Ready',
      description: 'App-controlled ambient lighting, locks & thermostatic climate',
      badge: 'Automation Enabled',
    },
    {
      icon: 'Sparkles',
      title: 'Premium Flooring',
      description: 'Imported Italian Bottochino marble in main hall & engineered oak in master bedroom',
      badge: 'Luxury Finish',
    },
    {
      icon: 'ChefHat',
      title: 'Modular Kitchen',
      description: 'Fully equipped German soft-close cabinets, quartz counters & integrated hob',
      badge: 'Fully Fitted',
    },
    {
      icon: 'Sun',
      title: 'Vaastu Compliant',
      description: '100% Architect-certified auspicious orientation and room placement',
      badge: 'Certified Architecture',
    },
  ];

  const displayList = highlights && highlights.length > 0 ? highlights : defaultHighlights;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-6 h-6 text-primary" />;
      case 'Square':
        return <Square className="w-6 h-6 text-indigo-600" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-purple-600" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'ChefHat':
        return <ChefHat className="w-6 h-6 text-rose-500" />;
      case 'Sun':
        return <Sun className="w-6 h-6 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-card text-text-primary rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Property Highlights
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Curated architectural specifications & luxury features defining this residence
          </p>
        </div>
        <span className="badge badge-primary text-[10px] uppercase font-semibold">Luxury Standard</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayList.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-soft transition-all duration-300 flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-surface-secondary rounded-xl shadow-xs border border-border group-hover:scale-110 transition-transform">
                {getIcon(item.icon)}
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {(item as any).badge || 'Featured'}
              </span>
            </div>

            <div>
              <h3 className="font-heading font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
