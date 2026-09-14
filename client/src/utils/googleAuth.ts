import { authApi } from '../api/auth.api';
import { toast } from '../contexts/ToastContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: (n: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          revoke: (hint: string, done: () => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

/** Load the official Google Identity Services script. */
export const loadGoogleScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('Google SDK timeout.')); }, 10000);
      return;
    }
    const s = document.createElement('script');
    s.id = 'google-gsi-client';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(s);
  });

/**
 * Initiates Google Sign-In using the renderButton + programmatic click approach.
 *
 * Google One-Tap prompt is suppressed by browser privacy/cookie settings in many
 * environments. Using renderButton() creates a real Google-signed button whose
 * click opens the native account-picker popup — works reliably in all browsers.
 *
 * A focus-return listener is installed on the window so that if the user closes
 * the Google popup without selecting an account, isSubmitting resets cleanly.
 */
export const initiateGoogleSignIn = async (
  onTokenReceived: (credential: string) => Promise<void>,
  onError?: (err: any) => void
): Promise<void> => {
  try {
    // 1. Resolve Client ID
    let clientId: string | null = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || null;
    try {
      const config = await authApi.getGoogleConfig();
      if (!config.configured || !config.client_id) {
        toast.error('Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in your .env file.');
        if (onError) onError(new Error('not configured'));
        return;
      }
      clientId = config.client_id;
    } catch {
      if (!clientId) {
        toast.error('Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in your .env file.');
        if (onError) onError(new Error('not configured'));
        return;
      }
    }

    // 2. Load Google SDK
    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services client is unavailable.');
    }

    // Track whether the flow completed (credential callback fired)
    let flowCompleted = false;

    // 3. Initialize
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        flowCompleted = true;
        document.getElementById('__gsi_overlay__')?.remove();
        if (!response.credential) {
          toast.error('No credential received from Google. Please try again.');
          if (onError) onError(new Error('no credential'));
          return;
        }
        try {
          await onTokenReceived(response.credential);
        } catch (err: any) {
          const msg = err?.response?.data?.detail || err?.message || 'Google authentication failed.';
          toast.error(msg);
          if (onError) onError(err);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      ux_mode: 'popup',
    });

    // 4. Render hidden button and click it
    document.getElementById('__gsi_overlay__')?.remove();
    const overlay = document.createElement('div');
    overlay.id = '__gsi_overlay__';
    overlay.style.position = 'fixed';
    overlay.style.top = '-9999px';
    overlay.style.left = '-9999px';
    overlay.style.width = '200px';
    overlay.style.height = '50px';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '-1';
    document.body.appendChild(overlay);

    window.google.accounts.id.renderButton(overlay, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 200,
    });

    // Wait for button to render
    await new Promise<void>((res) => setTimeout(res, 400));

    const btn =
      (overlay.querySelector('div[role="button"]') as HTMLElement) ||
      (overlay.querySelector('button') as HTMLElement) ||
      (overlay.firstElementChild as HTMLElement);

    // 5. Install a focus-return listener to detect popup close without selection
    const onFocusReturn = () => {
      window.removeEventListener('focus', onFocusReturn);
      // Give the credential callback a moment to fire first
      setTimeout(() => {
        if (!flowCompleted) {
          overlay.remove();
          // User closed the popup without signing in — reset loading state
          if (onError) onError(new Error('popup_closed_by_user'));
        }
      }, 500);
    };
    window.addEventListener('focus', onFocusReturn);

    if (btn) {
      btn.style.pointerEvents = 'auto';
      btn.click();
    } else {
      window.google.accounts.id.prompt((n: any) => {
        if (typeof n?.isNotDisplayed === 'function' && n.isNotDisplayed()) {
          overlay.remove();
          window.removeEventListener('focus', onFocusReturn);
          const reason = n.getNotDisplayedReason?.() || 'unknown';
          toast.error('Google Sign-In was blocked by browser. Please disable popup blockers and try again.');
          if (onError) onError(new Error(reason));
        } else if (typeof n?.isDismissedMoment === 'function' && n.isDismissedMoment()) {
          overlay.remove();
          window.removeEventListener('focus', onFocusReturn);
          if (onError) onError(new Error('dismissed'));
        }
      });
    }
  } catch (err: any) {
    console.error('[Google OAuth]', err);
    toast.error(err.message || 'Failed to initialize Google Sign-In.');
    if (onError) onError(err);
  }
};
