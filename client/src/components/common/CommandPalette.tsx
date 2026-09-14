import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, HardHat, CalendarCheck, MapPin, DollarSign, BarChart3, Bell, Settings, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const searchIndex = [
  { name: 'Dashboard Overview', path: '/admin/dashboard', icon: BarChart3, category: 'Pages' },
  { name: 'Revenue & Finance Engine', path: '/admin/revenue', icon: DollarSign, category: 'Finance' },
  { name: 'Commission Rules Configuration', path: '/admin/revenue/rules', icon: DollarSign, category: 'Finance' },
  { name: 'Partner Wallets & Balances', path: '/admin/revenue/wallets', icon: DollarSign, category: 'Finance' },
  { name: 'Property Management', path: '/admin/properties', icon: Building, category: 'Core' },
  { name: 'Add New Property', path: '/admin/properties/create', icon: Building, category: 'Core' },
  { name: 'Builder Onboarding', path: '/admin/builders', icon: HardHat, category: 'Core' },
  { name: 'Bookings & Agreements', path: '/admin/bookings', icon: CalendarCheck, category: 'Operations' },
  { name: 'Site Visits Calendar', path: '/admin/site-visits/calendar', icon: MapPin, category: 'Operations' },
  { name: 'Enterprise Analytics', path: '/admin/analytics', icon: BarChart3, category: 'Analytics' },
  { name: 'Notification Center', path: '/admin/notifications', icon: Bell, category: 'System' },
  { name: 'System Settings', path: '/admin/settings', icon: Settings, category: 'System' },
  { name: 'Document Management', path: '/admin/documents', icon: FileText, category: 'System' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filtered = searchIndex.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].path);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Input Header */}
          <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/50">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type a command or search pages... (e.g. Revenue, Bookings)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No matching commands found</div>
            ) : (
              filtered.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                      isSelected ? 'bg-primary text-white shadow-soft' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer keyboard guidance */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate • ↵ to select • ESC to dismiss</span>
            <span>EstateFlow Command Palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
