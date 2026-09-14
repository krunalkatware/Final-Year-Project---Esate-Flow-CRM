import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Re-export toast for ease of use across components
export { toast };

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#101828',
            boxShadow: '0 12px 24px -4px rgba(16,24,40,0.12), 0 4px 8px -2px rgba(16,24,40,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            border: '1px solid #E4E7EC',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#12B76A',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#F04438',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </>
  );
};
