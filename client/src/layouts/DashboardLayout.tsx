import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { 
  LayoutDashboard, 
  Calendar, 
  Heart, 
  MapPin, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Building2,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sidebarLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Investments', path: '/dashboard/investments', icon: TrendingUp },
    { name: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
    { name: 'Wishlist', path: '/dashboard/wishlist', icon: Heart },
    { name: 'Site Visits', path: '/dashboard/site-visits', icon: MapPin },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];


  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col pt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="space-y-6">
            
            {/* User Profile Card */}
            <div className="bg-card rounded-3xl p-6 border border-border shadow-card flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-heading font-extrabold text-xl overflow-hidden shadow-soft shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
                ) : (
                  `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`
                )}
              </div>
              <div className="min-w-0">
                <span className="badge badge-primary text-[10px] font-semibold uppercase">Customer Account</span>
                <h3 className="font-heading font-bold text-base text-text-primary truncate mt-0.5">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Links List */}
            <div className="bg-card rounded-3xl p-3 border border-border shadow-card space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    end={link.path === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white font-semibold shadow-soft'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </NavLink>
                );
              })}

              <div className="pt-2 border-t border-border mt-2 space-y-1">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-text-secondary">Theme</span>
                  <ThemeToggle compact />
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Future Architecture Modules Teaser Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-700 shadow-card space-y-3">
              <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>EstateFlow Enterprise</span>
              </div>
              <h4 className="font-heading font-bold text-sm">Premium Features Active</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Revenue Sharing Engine</li>
                <li>CRM &amp; Lead Tracking</li>
                <li>AI Property Matching</li>
                <li>Settlement Automation</li>
              </ul>
              <div className="text-[10px] text-slate-400 pt-1">
                Enterprise SaaS — All systems live.
              </div>
            </div>

          </aside>

          {/* Main Dashboard Content Area */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
};
