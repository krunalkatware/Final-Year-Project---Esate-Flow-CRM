import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  Building2, 
  Search, 
  User as UserIcon, 
  Heart, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  LayoutDashboard, 
  Bell 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: 'Projects', path: '/projects' },
    { name: 'Builders', path: '/builders' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isHomePage
          ? 'bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-b border-border shadow-soft py-3 text-text-primary'
          : 'bg-gradient-to-b from-black/70 via-black/35 to-transparent text-white py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className={`p-2 rounded-xl transition-transform group-hover:scale-105 ${
              isScrolled || !isHomePage ? 'bg-primary text-white' : 'bg-white text-primary'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className={`font-heading font-extrabold text-xl tracking-tight ${
                isScrolled || !isHomePage ? 'text-text-primary' : 'text-white'
              }`}>
                Estate<span className="text-primary">Flow</span>
              </span>
              <span className={`text-[10px] font-medium tracking-wider uppercase -mt-1 ${
                isScrolled || !isHomePage ? 'text-text-secondary' : 'text-white/80'
              }`}>
                Real Estate Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? isScrolled || !isHomePage
                        ? 'bg-primary-50 dark:bg-primary/15 text-primary font-semibold'
                        : 'bg-white/20 text-white font-semibold'
                      : isScrolled || !isHomePage
                      ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Auth / Theme / Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle compact />

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border transition-all ${
                    isScrolled || !isHomePage
                      ? 'border-border bg-card text-text-primary hover:border-primary/40'
                      : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
                    ) : (
                      `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user.first_name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-hover border border-border py-2 z-20 animate-scale-in">
                      <div className="px-4 py-2.5 border-b border-border">
                        <p className="text-xs font-medium text-text-secondary">Signed in as</p>
                        <p className="text-sm font-semibold text-text-primary truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          Dashboard
                        </Link>
                        <Link
                          to="/dashboard/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                        >
                          <Calendar className="w-4 h-4 text-secondary" />
                          My Bookings
                        </Link>
                        <Link
                          to="/dashboard/wishlist"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                        >
                          <Heart className="w-4 h-4 text-red-500" />
                          Wishlist
                        </Link>
                        <Link
                          to="/dashboard/notifications"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                        >
                          <Bell className="w-4 h-4 text-accent" />
                          Notifications
                        </Link>
                      </div>

                      <div className="border-t border-border pt-1 mt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    isScrolled || !isHomePage
                      ? 'text-text-primary hover:text-primary'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm px-5 py-2.5 shadow-soft"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                isScrolled || !isHomePage ? 'text-text-primary' : 'text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 bg-card rounded-2xl shadow-card p-4 text-text-primary">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-secondary"
                >
                  {link.name}
                </Link>
              ))}

              <div className="border-t border-border pt-3 mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary w-full"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="btn btn-outline w-full text-red-500 border-red-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-outline w-full"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary w-full"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
