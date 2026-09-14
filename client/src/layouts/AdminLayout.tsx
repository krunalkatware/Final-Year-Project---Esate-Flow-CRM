import React, { useState, useEffect } from 'react';

import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROLE_COLORS, ADMIN_ROLE_LABELS } from '../types/admin';
import { apiClient } from '../api/axios';
import {
  Building2,
  LayoutDashboard,
  Building,
  HardHat,
  Users,
  CalendarCheck,
  MapPin,
  Star,
  DollarSign,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  User,
  Search,
  PanelLeftClose,
  PanelLeft,
  Target,
} from 'lucide-react';
import { CommandPalette } from '../components/common/CommandPalette';
import { PageTransition } from '../components/common/PageTransition';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { QuickActionsPanel } from '../components/common/QuickActionsPanel';


interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: { name: string; path: string }[];
}

const sidebarLinks: SidebarItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  {
    name: 'Property Management',
    path: '/admin/properties',
    icon: Building,
    subItems: [
      { name: 'All Properties', path: '/admin/properties' },
      { name: 'Add Property', path: '/admin/properties/create' },
    ],
  },
  {
    name: 'Builders',
    path: '/admin/builders',
    icon: HardHat,
    subItems: [
      { name: 'All Builders', path: '/admin/builders' },
      { name: 'Onboard Builder', path: '/admin/builders/create' },
    ],
  },
  {
    name: 'CRM',
    path: '/admin/crm',
    icon: Target,
    badge: 'Live',
    subItems: [
      { name: 'CRM Overview', path: '/admin/crm' },
      { name: 'Leads', path: '/admin/crm/leads' },
      { name: 'Kanban Board', path: '/admin/crm/kanban' },
      { name: 'Customers', path: '/admin/crm/customers' },
    ],
  },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck, badge: 'New' },
  { name: 'Site Visits', path: '/admin/site-visits', icon: MapPin },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Revenue', path: '/admin/revenue', icon: DollarSign },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Documents', path: '/admin/documents', icon: FileText },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: '5' },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['Dashboard', 'Property Management', 'Builders', 'CRM', 'Bookings', 'Site Visits', 'Reviews', 'Revenue', 'Analytics', 'Documents', 'Notifications', 'Settings'],
  admin: ['Dashboard', 'Property Management', 'Builders', 'CRM', 'Bookings', 'Site Visits', 'Reviews', 'Revenue', 'Analytics', 'Documents', 'Notifications', 'Settings'],
  sales_manager: ['Dashboard', 'Property Management', 'CRM', 'Bookings', 'Site Visits', 'Revenue', 'Analytics', 'Documents', 'Notifications'],
  sales_executive: ['Dashboard', 'Property Management', 'CRM', 'Bookings', 'Site Visits', 'Notifications'],
  customer_support: ['Dashboard', 'CRM', 'Bookings', 'Reviews', 'Notifications', 'Settings'],
};

// Section groupings for cleaner sidebar labels
const SECTION_LABELS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Property Management': 'Listings',
  'Builders': 'Listings',
  'CRM': 'CRM & Sales',
  'Bookings': 'CRM & Sales',
  'Site Visits': 'CRM & Sales',
  'Reviews': 'Content',
  'Revenue': 'Finance',
  'Analytics': 'Finance',
  'Documents': 'Operations',
  'Notifications': 'Operations',
  'Settings': 'Operations',
};

export const AdminLayout: React.FC = () => {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<Array<{ id: number; title: string; desc: string; time: string; is_read: boolean }>>([]);

  useEffect(() => {
    const fetchNotifs = () => {
      apiClient.get('/notifications/admin-feed')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setLiveNotifications(res.data.slice(0, 5).map((n: any) => ({
              id: n.id,
              title: n.title,
              desc: n.message,
              is_read: n.is_read,
              time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            })));
          }
        })
        .catch(() => null);
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'Property Management': true,
    Builders: true,
    CRM: true,
  });

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const roleLabel = adminUser
    ? ADMIN_ROLE_LABELS[adminUser.admin_role] ?? adminUser.admin_role_display
    : '';
  const roleColor = adminUser
    ? ADMIN_ROLE_COLORS[adminUser.admin_role] ?? 'bg-slate-100 text-slate-700'
    : '';
  const initials = adminUser
    ? `${adminUser.first_name[0] ?? ''}${adminUser.last_name[0] ?? ''}`.toUpperCase()
    : 'A';

  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Filtered links based on role
  const visibleLinks = sidebarLinks.filter((link) => {
    if (!adminUser) return true;
    const allowed = ROLE_PERMISSIONS[adminUser.admin_role];
    return allowed ? allowed.includes(link.name) : true;
  });

  // Render sidebar section label only when label changes
  let lastSection = '';

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--admin-bg, #F7F6F2)' }}
    >
      {/* ── Mobile Drawer Overlay ─────────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── PREMIUM SIDEBAR ──────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          w-64
        `}
        style={{
          background: 'var(--admin-sidebar-bg, #FFFFFF)',
          borderRight: '1px solid var(--admin-sidebar-border, #E7E5E0)',
        }}
      >
        {/* ── Logo Header ────────────────────────────────────────────────── */}
        <div
          className="h-16 flex items-center justify-between px-4 shrink-0"
          style={{ borderBottom: '1px solid var(--admin-sidebar-border, #E7E5E0)' }}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1F7A68 0%, #16324F 100%)',
                boxShadow: '0 4px 12px rgba(31,122,104,0.25)',
              }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span
                  className="font-heading font-extrabold text-base tracking-tight truncate block"
                  style={{ color: '#16324F' }}
                >
                  Estate<span style={{ color: '#1F7A68' }}>Flow</span>
                </span>
                <p className="text-[10px] font-medium" style={{ color: '#94A3B8' }}>
                  Admin Enterprise
                </p>
              </div>
            )}
          </div>
          <button
            className="lg:hidden p-1 rounded-lg transition-colors"
            style={{ color: '#64748B' }}
            onClick={() => setMobileDrawerOpen(false)}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1EFE9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Admin Profile Mini Card ────────────────────────────────────── */}
        {!isCollapsed && (
          <div
            className="px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid var(--admin-sidebar-border, #E7E5E0)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #1F7A68, #16324F)',
                  boxShadow: '0 2px 8px rgba(31,122,104,0.20)',
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: '#1E293B' }}>
                  {adminUser?.full_name}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#94A3B8' }}>
                  {adminUser?.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleColor}`}
              >
                <Shield className="w-2.5 h-2.5" />
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        {/* ── Navigation Menu ───────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-0.5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const hasSub = link.subItems && link.subItems.length > 0;
            const isSubOpen = openSubMenus[link.name] ?? false;
            const isActiveParent = location.pathname.startsWith(link.path);
            const section = SECTION_LABELS[link.name] || '';

            // Inject section label when it changes
            const showLabel = !isCollapsed && section !== lastSection;
            const labelNode = showLabel ? (
              <p
                key={`label-${section}`}
                className="text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1.5"
                style={{ color: '#94A3B8' }}
              >
                {section}
              </p>
            ) : null;
            lastSection = section;

            return (
              <React.Fragment key={link.name}>
                {labelNode}
                <div>
                  {hasSub ? (
                    <>
                      <button
                        onClick={() => toggleSubMenu(link.name)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          color: isActiveParent
                            ? 'var(--admin-sidebar-active-text, #1F7A68)'
                            : 'var(--admin-sidebar-text, #475569)',
                          background: isActiveParent
                            ? 'var(--admin-sidebar-active-bg, #DDEFE9)'
                            : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActiveParent) {
                            e.currentTarget.style.background = 'var(--admin-sidebar-hover-bg, #F1EFE9)';
                            e.currentTarget.style.color = 'var(--admin-sidebar-hover-text, #1F7A68)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActiveParent) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--admin-sidebar-text, #475569)';
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className="w-4 h-4 shrink-0"
                            style={{ color: isActiveParent ? '#1F7A68' : '#94A3B8' }}
                          />
                          {!isCollapsed && <span className="truncate">{link.name}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className="w-3.5 h-3.5 transition-transform duration-200 shrink-0"
                            style={{
                              transform: isSubOpen ? 'rotate(180deg)' : 'none',
                              color: isSubOpen ? '#1F7A68' : '#94A3B8',
                            }}
                          />
                        )}
                      </button>

                      {!isCollapsed && isSubOpen && (
                        <div
                          className="ml-4 pl-3 my-1 space-y-0.5"
                          style={{ borderLeft: '2px solid #E7E5E0' }}
                        >
                          {link.subItems?.map((sub) => (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              end
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isActive ? '' : ''
                                }`
                              }
                              style={({ isActive }) => ({
                                color: isActive ? '#1F7A68' : '#64748B',
                                background: isActive ? '#DDEFE9' : 'transparent',
                                fontWeight: isActive ? 600 : 500,
                              })}
                            >
                              {({ isActive }) => (
                                <>
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: isActive ? '#1F7A68' : '#D4D1CA' }}
                                  />
                                  {sub.name}
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={link.path}
                      end={link.path === '/admin/dashboard'}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={({ isActive }) => ({
                        color: isActive
                          ? 'var(--admin-sidebar-active-text, #1F7A68)'
                          : 'var(--admin-sidebar-text, #475569)',
                        background: isActive
                          ? 'var(--admin-sidebar-active-bg, #DDEFE9)'
                          : 'transparent',
                        borderLeft: isActive ? '2.5px solid #1F7A68' : '2.5px solid transparent',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className="w-4 h-4 shrink-0"
                              style={{ color: isActive ? '#1F7A68' : '#94A3B8' }}
                            />
                            {!isCollapsed && <span className="truncate">{link.name}</span>}
                          </div>
                          {!isCollapsed && link.badge && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                background: link.badge === 'New' ? '#DDEFE9' : '#F3E7D3',
                                color: link.badge === 'New' ? '#1F7A68' : '#92400E',
                              }}
                            >
                              {link.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        {/* ── Sidebar Footer ─────────────────────────────────────────────── */}
        <div
          className="p-3 shrink-0 space-y-1"
          style={{ borderTop: '1px solid var(--admin-sidebar-border, #E7E5E0)' }}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: 'var(--admin-sidebar-text-muted, #94A3B8)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--admin-sidebar-hover-bg, #F1EFE9)';
              e.currentTarget.style.color = 'var(--admin-sidebar-hover-text, #1F7A68)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--admin-sidebar-text-muted, #94A3B8)';
            }}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Menu</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: 'var(--admin-sidebar-text-muted, #94A3B8)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--admin-sidebar-text-muted, #94A3B8)';
            }}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── PREMIUM HEADER ─────────────────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30"
          style={{
            background: 'var(--admin-header-bg, rgba(255,255,255,0.95))',
            borderBottom: '1px solid var(--admin-header-border, #E7E5E0)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 1px 8px rgba(22,50,79,0.05)',
          }}
        >
          {/* Left: Mobile menu & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary, #64748B)' }}
              onClick={() => setMobileDrawerOpen(true)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-secondary, #F1EFE9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--primary, #1F7A68)' }} />
              <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Admin</span>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-3 h-3" style={{ color: 'var(--border, #D4D1CA)' }} />
                  <span
                    className={`capitalize ${
                      index === pathSegments.length - 1
                        ? 'text-text-primary font-semibold'
                        : 'text-text-muted font-normal'
                    }`}
                  >
                    {segment.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Middle: Global Search */}
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center relative w-72 lg:w-96 cursor-pointer"
          >
            <Search className="w-4 h-4 absolute left-3 text-text-muted" />
            <input
              type="text"
              readOnly
              placeholder="Search properties, builders, bookings... (Cmd+K)"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs cursor-pointer transition-all bg-surface border border-border text-text-primary"
            />
            <kbd className="absolute right-3 text-[10px] px-1.5 py-0.5 rounded border font-mono text-text-muted bg-surface-secondary border-border">
              ⌘K
            </kbd>
          </div>

          {/* Right: Theme, Notifications, Profile */}
          <div className="flex items-center gap-2">
            <ThemeToggle compact />

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl transition-all text-text-secondary hover:bg-surface-secondary hover:text-primary"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {liveNotifications.some((n) => !n.is_read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 p-4 space-y-3 animate-scale-in bg-card border border-border shadow-hover">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <p className="text-xs font-bold text-text-primary">
                          Notifications
                        </p>
                        {liveNotifications.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
                            {liveNotifications.filter((n) => !n.is_read).length} Unread
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                        {liveNotifications.length > 0 ? (
                          liveNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate('/admin/notifications');
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                                n.is_read
                                  ? 'bg-surface-secondary/40 hover:bg-surface border-transparent hover:border-border'
                                  : 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                              }`}
                            >
                              <p className="font-semibold text-text-primary">{n.title}</p>
                              <p className="text-[11px] text-text-secondary line-clamp-2">{n.desc}</p>
                              <span className="text-[9px] text-text-muted mt-1 block">{n.time}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-text-muted text-xs">
                            No notifications yet
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-border text-center">
                        <button
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate('/admin/notifications');
                          }}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          View all notifications →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                id="admin-profile-btn"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all text-xs hover:bg-surface-secondary"
                onClick={() => setProfileOpen((o) => !o)}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 bg-gradient-to-br from-primary to-navy shadow-sm"
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none text-text-primary">
                    {adminUser?.first_name}
                  </p>
                  <p className="text-[10px] leading-none mt-0.5 text-text-muted">
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform text-text-muted ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden animate-scale-in"
                    style={{
                      background: 'var(--card, #FFFFFF)',
                      border: '1px solid var(--border, #E7E5E0)',
                      boxShadow: '0 8px 32px rgba(22,50,79,0.12)',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border, #E7E5E0)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary, #1E293B)' }}>
                        {adminUser?.full_name}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted, #94A3B8)' }}>
                        {adminUser?.email}
                      </p>
                      <span
                        className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${roleColor}`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {roleLabel}
                      </span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {[
                        { icon: User, label: 'My Profile' },
                        { icon: Settings, label: 'Settings' },
                      ].map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left"
                          style={{ color: 'var(--text-secondary, #475569)' }}
                          onClick={() => setProfileOpen(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface-secondary, #F1EFE9)';
                            e.currentTarget.style.color = 'var(--primary, #1F7A68)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary, #475569)';
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="p-1.5" style={{ borderTop: '1px solid var(--border, #E7E5E0)' }}>
                      <button
                        id="admin-logout-btn"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left"
                        style={{ color: '#EF4444' }}
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content Viewport ─────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto"
          style={{ background: 'var(--admin-bg, #F7F6F2)' }}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <QuickActionsPanel />
    </div>
  );
};
