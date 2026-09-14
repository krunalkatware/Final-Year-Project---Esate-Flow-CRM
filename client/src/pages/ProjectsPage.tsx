import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, MapPin, ArrowRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const projects = [
    {
      name: 'Lodha World One',
      builder: 'Lodha Group',
      city: 'Mumbai',
      locality: 'Lower Parel',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      units: '800 Luxury Units',
      possession: 'Dec 2026',
      price: '₹2.85 Cr onwards',
    },
    {
      name: 'Prestige Lakeside Habitat',
      builder: 'Prestige Group',
      city: 'Bangalore',
      locality: 'Whitefield',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      units: '500 Premium Villas & Apartments',
      possession: 'Ready to Move',
      price: '₹1.55 Cr onwards',
    },
    {
      name: 'Godrej Meridien',
      builder: 'Godrej Properties',
      city: 'Delhi NCR',
      locality: 'Sector 106, Gurugram',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      units: '350 French Residence Units',
      possession: 'Ready to Move',
      price: '₹1.85 Cr onwards',
    },
    {
      name: 'Shapoorji Pallonji Joyville',
      builder: 'Shapoorji Pallonji',
      city: 'Pune',
      locality: 'Baner',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      units: '600 Smart Homes',
      possession: 'June 2027',
      price: '₹1.28 Cr onwards',
    },
  ];

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="badge badge-primary uppercase text-[10px]">Mega Townships</span>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary mt-1">Upcoming Mega Projects</h1>
          <p className="text-sm text-text-secondary mt-1">Explore master-planned townships & flagship developments across India</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj) => (
            <div key={proj.name} className="bg-card rounded-3xl border border-border shadow-card overflow-hidden group transition-all hover:border-primary">
              <div className="relative h-64 bg-slate-900">
                <img src={proj.image} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md text-text-primary px-3 py-1 rounded-xl text-xs font-semibold border border-border/50">
                  {proj.builder}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-text-primary">{proj.name}</h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {proj.locality}, {proj.city}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-surface-secondary border border-border rounded-2xl text-xs text-center font-medium">
                  <div>
                    <span className="text-text-muted block text-[10px]">Scale</span>
                    <span className="text-text-primary font-semibold">{proj.units}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Possession</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{proj.possession}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Starting</span>
                    <span className="text-primary font-bold">{proj.price}</span>
                  </div>
                </div>

                <Link to={`/properties?search=${proj.name}`} className="btn btn-primary btn-sm w-full justify-center gap-1">
                  View Available Inventory
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
