import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './router';
import { CinematicIntro, shouldShowCinema } from './components/cinematic/CinematicIntro';

import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  // Only show intro once per browser session, and only on the public-facing site
  const [showIntro, setShowIntro] = useState<boolean>(() => shouldShowCinema());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <ToastProvider>
                {/* Cinematic intro — purely presentational, does not block routing */}
                {showIntro && (
                  <CinematicIntro onComplete={() => setShowIntro(false)} />
                )}
                <AppRouter />
              </ToastProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
