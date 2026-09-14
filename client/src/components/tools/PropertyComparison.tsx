import React, { useState } from 'react';
import { ArrowLeftRight, Check, X, Building, MapPin, DollarSign, ShieldCheck, Star } from 'lucide-react';

export interface CompareProperty {
  id: number;
  name: string;
  location: string;
  price: number;
  bhk: string;
  carpetArea: number;
  pricePerSqft: number;
  rera: string;
  rating: number;
  amenities: string[];
  image: string;
}

const DEFAULT_SAMPLE_PROPERTIES: CompareProperty[] = [
  {
    id: 1,
    name: 'Skyline Azure Heights',
    location: 'Bandra West, Mumbai',
    price: 32500000,
    bhk: '3 BHK',
    carpetArea: 1450,
    pricePerSqft: 22413,
    rera: 'P51800024912',
    rating: 4.8,
    amenities: ['Swimming Pool', 'Gymnasium', 'Club House', '24/7 Security', 'EV Charging'],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    name: 'Grand Horizon Residences',
    location: 'Worli, Mumbai',
    price: 45000000,
    bhk: '4 BHK',
    carpetArea: 1980,
    pricePerSqft: 22727,
    rera: 'P51900018420',
    rating: 4.9,
    amenities: ['Sea View', 'Infinity Pool', 'Concierge Service', 'Private Elevator', 'Gymnasium'],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
  },
];

export const PropertyComparison: React.FC<{ items?: CompareProperty[] }> = ({ items }) => {
  const properties = items && items.length >= 2 ? items : DEFAULT_SAMPLE_PROPERTIES;

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const allAmenities = Array.from(
    new Set(properties.flatMap((p) => p.amenities))
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white">Property Side-by-Side Comparison</h3>
            <p className="text-xs text-slate-400">Evaluate specifications, pricing, RERA &amp; amenities side-by-side</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
          {properties.length} Properties Selected
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-4 bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider rounded-tl-2xl w-48">
                Specification
              </th>
              {properties.map((p) => (
                <th key={p.id} className="p-4 bg-slate-950/80 min-w-[240px]">
                  <div className="space-y-3">
                    <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-xl border border-slate-800" />
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary shrink-0" /> {p.location}
                      </p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {/* Price */}
            <tr>
              <td className="p-4 font-semibold text-slate-400 text-xs uppercase">Price</td>
              {properties.map((p) => (
                <td key={p.id} className="p-4 font-extrabold text-emerald-400 text-lg font-heading">
                  {formatINR(p.price)}
                </td>
              ))}
            </tr>
            {/* Configuration */}
            <tr>
              <td className="p-4 font-semibold text-slate-400 text-xs uppercase">Configuration</td>
              {properties.map((p) => (
                <td key={p.id} className="p-4 font-bold text-white text-sm">
                  {p.bhk}
                </td>
              ))}
            </tr>
            {/* Carpet Area */}
            <tr>
              <td className="p-4 font-semibold text-slate-400 text-xs uppercase">Carpet Area</td>
              {properties.map((p) => (
                <td key={p.id} className="p-4 text-slate-200 text-sm font-mono">
                  {p.carpetArea.toLocaleString()} sq.ft
                </td>
              ))}
            </tr>
            {/* Price / SqFt */}
            <tr>
              <td className="p-4 font-semibold text-slate-400 text-xs uppercase">Rate / sq.ft</td>
              {properties.map((p) => (
                <td key={p.id} className="p-4 text-slate-300 text-xs font-mono">
                  ₹{p.pricePerSqft.toLocaleString()}/sq.ft
                </td>
              ))}
            </tr>
            {/* RERA Number */}
            <tr>
              <td className="p-4 font-semibold text-slate-400 text-xs uppercase">RERA Registered</td>
              {properties.map((p) => (
                <td key={p.id} className="p-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" /> {p.rera}
                  </span>
                </td>
              ))}
            </tr>
            {/* Amenities Section Header */}
            <tr className="bg-slate-950/40">
              <td colSpan={properties.length + 1} className="p-3 text-xs font-bold text-primary uppercase tracking-widest">
                Amenities &amp; Features Matrix
              </td>
            </tr>
            {allAmenities.map((amenity) => (
              <tr key={amenity}>
                <td className="p-4 text-xs font-medium text-slate-400">{amenity}</td>
                {properties.map((p) => {
                  const hasIt = p.amenities.includes(amenity);
                  return (
                    <td key={p.id} className="p-4">
                      {hasIt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <Check className="w-4 h-4 text-emerald-400" /> Included
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <X className="w-4 h-4 text-slate-600" /> —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
