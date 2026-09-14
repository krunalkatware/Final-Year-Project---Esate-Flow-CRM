import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminProtectedRoute } from './AdminProtectedRoute';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Lazy loaded page components
const LandingPage = lazy(() => import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const PropertiesPage = lazy(() => import('../pages/properties/PropertiesPage').then((m) => ({ default: m.PropertiesPage })));
const PropertyDetailPage = lazy(() => import('../pages/properties/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const BuildersPage = lazy(() => import('../pages/BuildersPage').then((m) => ({ default: m.BuildersPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then((m) => ({ default: m.ContactPage })));

const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BookingsPage = lazy(() => import('../pages/dashboard/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const WishlistPage = lazy(() => import('../pages/dashboard/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const SiteVisitsPage = lazy(() => import('../pages/dashboard/SiteVisitsPage').then((m) => ({ default: m.SiteVisitsPage })));
const NotificationsPage = lazy(() => import('../pages/dashboard/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('../pages/dashboard/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin lazy imports
const AdminLoginPage = lazy(() => import('../pages/admin/login/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminUnauthorizedPage = lazy(() => import('../pages/admin/AdminUnauthorizedPage').then((m) => ({ default: m.AdminUnauthorizedPage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const PropertyList = lazy(() => import('../pages/admin/properties/PropertyList').then((m) => ({ default: m.PropertyList })));
const PropertyWizard = lazy(() => import('../pages/admin/properties/PropertyWizard').then((m) => ({ default: m.PropertyWizard })));
const PropertyDetailAdmin = lazy(() => import('../pages/admin/properties/PropertyDetailAdmin').then((m) => ({ default: m.PropertyDetailAdmin })));
const BuilderList = lazy(() => import('../pages/admin/builders/BuilderList').then((m) => ({ default: m.BuilderList })));
const BuilderWizard = lazy(() => import('../pages/admin/builders/BuilderWizard').then((m) => ({ default: m.BuilderWizard })));
const BuilderDetailAdmin = lazy(() => import('../pages/admin/builders/BuilderDetailAdmin').then((m) => ({ default: m.BuilderDetailAdmin })));

// CRM lazy imports
const CRMDashboardPage = lazy(() => import('../pages/admin/crm/CRMDashboardPage'));
const LeadListPage = lazy(() => import('../pages/admin/crm/LeadListPage'));
const LeadCreatePage = lazy(() => import('../pages/admin/crm/LeadCreatePage'));
const LeadDetailAdminPage = lazy(() => import('../pages/admin/crm/LeadDetailAdminPage'));
const LeadKanbanPage = lazy(() => import('../pages/admin/crm/LeadKanbanPage'));
const LeadFormModal = lazy(() => import('../pages/admin/crm/LeadFormModal'));
const CustomerListPage = lazy(() => import('../pages/admin/crm/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('../pages/admin/crm/CustomerDetailPage'));

// Booking Management lazy imports
const BookingDashboardPage = lazy(() => import('../pages/admin/bookings/BookingDashboardPage'));
const BookingListPage = lazy(() => import('../pages/admin/bookings/BookingListPage'));
const BookingWizard = lazy(() => import('../pages/admin/bookings/BookingWizard'));
const BookingDetailAdminPage = lazy(() => import('../pages/admin/bookings/BookingDetailAdminPage'));
const BookingAnalyticsPage = lazy(() => import('../pages/admin/bookings/BookingAnalyticsPage'));
const BookingAuditPage = lazy(() => import('../pages/admin/bookings/BookingAuditPage'));

// Site Visits lazy imports
const SiteVisitDashboardPage = lazy(() => import('../pages/admin/site-visits/SiteVisitDashboardPage'));
const SiteVisitListPage = lazy(() => import('../pages/admin/site-visits/SiteVisitListPage'));
const SiteVisitCalendarPage = lazy(() => import('../pages/admin/site-visits/SiteVisitCalendarPage'));
const SiteVisitAnalyticsPage = lazy(() => import('../pages/admin/site-visits/SiteVisitAnalyticsPage'));
const SiteVisitWizard = lazy(() => import('../pages/admin/site-visits/SiteVisitWizard'));
const SiteVisitDetailPage = lazy(() => import('../pages/admin/site-visits/SiteVisitDetailPage'));

// Revenue lazy imports
const RevenueDashboardPage = lazy(() => import('../pages/admin/revenue/RevenueDashboardPage'));
const CommissionRulesPage = lazy(() => import('../pages/admin/revenue/CommissionRulesPage'));
const WalletManagementPage = lazy(() => import('../pages/admin/revenue/WalletManagementPage'));
const SettlementsPage = lazy(() => import('../pages/admin/revenue/SettlementsPage'));
const RevenueReportsPage = lazy(() => import('../pages/admin/revenue/RevenueReportsPage'));

// Admin missing section lazy imports
const AnalyticsDashboardPage = lazy(() => import('../pages/admin/analytics/AnalyticsDashboardPage'));
const AdminNotificationsPage = lazy(() => import('../pages/admin/notifications/AdminNotificationsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/settings/AdminSettingsPage'));
const AdminDocumentsPage = lazy(() => import('../pages/admin/documents/AdminDocumentsPage'));
const ReviewDashboardPage = lazy(() => import('../pages/admin/reviews/ReviewDashboardPage').then((m) => ({ default: m.ReviewDashboardPage })));

// Customer Investments lazy import
const CustomerInvestmentPage = lazy(() => import('../pages/dashboard/InvestmentPage').then((m) => ({ default: m.InvestmentPage })));


const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const AdminPageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <RootLayout />
      </ErrorBoundary>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        ),
      },
      {
        path: 'properties',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PropertiesPage />
          </Suspense>
        ),
      },
      {
        path: 'properties/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PropertyDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'builders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BuildersPage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'investments',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CustomerInvestmentPage />
              </Suspense>
            ),
          },
          {
            path: 'bookings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BookingsPage />
              </Suspense>
            ),
          },
          {
            path: 'wishlist',
            element: (
              <Suspense fallback={<PageLoader />}>
                <WishlistPage />
              </Suspense>
            ),
          },
          {
            path: 'site-visits',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SiteVisitsPage />
              </Suspense>
            ),
          },
          {
            path: 'notifications',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NotificationsPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  // ── Admin Routes ───────────────────────────────────────────────────────────
  {
    path: 'admin/login',
    element: (
      <Suspense fallback={<AdminPageLoader />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: 'admin/unauthorized',
    element: (
      <Suspense fallback={<AdminPageLoader />}>
        <AdminUnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: 'admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'properties',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <PropertyList />
          </Suspense>
        ),
      },
      {
        path: 'properties/create',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <PropertyWizard />
          </Suspense>
        ),
      },
      {
        path: 'properties/edit/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <PropertyWizard />
          </Suspense>
        ),
      },
      {
        path: 'properties/view/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <PropertyDetailAdmin />
          </Suspense>
        ),
      },
      {
        path: 'builders',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BuilderList />
          </Suspense>
        ),
      },
      {
        path: 'builders/create',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BuilderWizard />
          </Suspense>
        ),
      },
      {
        path: 'builders/edit/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BuilderWizard />
          </Suspense>
        ),
      },
      {
        path: 'builders/view/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BuilderDetailAdmin />
          </Suspense>
        ),
      },

      // ── CRM Routes ────────────────────────────────────────────────────────
      {
        path: 'crm',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <CRMDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/leads',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <LeadListPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/leads/create',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <LeadCreatePage />
          </Suspense>
        ),
      },
      {
        path: 'crm/leads/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <LeadDetailAdminPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/kanban',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <LeadKanbanPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/customers',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <CustomerListPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/customers/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <CustomerDetailPage />
          </Suspense>
        ),
      },

      // ── Booking Management Routes ──────────────────────────────────────────
      {
        path: 'bookings',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'bookings/list',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingListPage />
          </Suspense>
        ),
      },
      {
        path: 'bookings/new',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingWizard />
          </Suspense>
        ),
      },
      {
        path: 'bookings/analytics',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingAnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'bookings/audit',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingAuditPage />
          </Suspense>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <BookingDetailAdminPage />
          </Suspense>
        ),
      },

      // ── Site Visits Routes ────────────────────────────────────────────────
      {
        path: 'site-visits',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'site-visits/list',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitListPage />
          </Suspense>
        ),
      },
      {
        path: 'site-visits/calendar',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitCalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'site-visits/analytics',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitAnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'site-visits/new',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitWizard />
          </Suspense>
        ),
      },
      {
        path: 'site-visits/:id',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SiteVisitDetailPage />
          </Suspense>
        ),
      },

      // ── Revenue Sharing Engine Routes ──────────────────────────────────────
      {
        path: 'revenue',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <RevenueDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'revenue/rules',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <CommissionRulesPage />
          </Suspense>
        ),
      },
      {
        path: 'revenue/wallets',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <WalletManagementPage />
          </Suspense>
        ),
      },
      {
        path: 'revenue/settlements',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <SettlementsPage />
          </Suspense>
        ),
      },
      {
        path: 'revenue/reports',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <RevenueReportsPage />
          </Suspense>
        ),
      },

      // ── Enterprise Analytics ──────────────────────────────────────────────
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <AnalyticsDashboardPage />
          </Suspense>
        ),
      },

      // ── Notification Center ────────────────────────────────────────────────
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <AdminNotificationsPage />
          </Suspense>
        ),
      },

      // ── Governance & Settings ──────────────────────────────────────────────
      {
        path: 'settings',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <AdminSettingsPage />
          </Suspense>
        ),
      },

      // ── Document Management ────────────────────────────────────────────────
      {
        path: 'documents',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <AdminDocumentsPage />
          </Suspense>
        ),
      },

      // ── Review Management ──────────────────────────────────────────────────
      {
        path: 'reviews',
        element: (
          <Suspense fallback={<AdminPageLoader />}>
            <ReviewDashboardPage />
          </Suspense>
        ),
      },
    ],
  },


  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
