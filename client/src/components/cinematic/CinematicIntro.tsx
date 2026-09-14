import React, { useState, useEffect, useRef } from 'react';

const CINEMA_SESSION_KEY = 'estateflow_cinema_shown';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'loading' | 'visible' | 'exiting'>('loading');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger exit transition after 4.5s
  const scheduleExit = () => {
    exitTimeoutRef.current = setTimeout(() => {
      setPhase('exiting');
      setTimeout(onComplete, 850);
    }, 4500);
  };

  // Progress bar animation
  useEffect(() => {
    const start = Date.now();
    const duration = 4500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Small delay to allow phase 'loading' → 'visible' fade transition
    const showTimer = setTimeout(() => setPhase('visible'), 80);
    scheduleExit();

    // Attempt video play
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — still exit gracefully on schedule
      });
    }

    return () => {
      clearTimeout(showTimer);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  const handleSkip = () => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    setPhase('exiting');
    setTimeout(onComplete, 850);
  };

  return (
    <div
      className={`cinema-overlay ${phase === 'exiting' ? 'exit' : ''}`}
      style={{ opacity: phase === 'loading' ? 0 : 1, transition: 'opacity 0.5s ease' }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.35,
        }}
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-40618-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient Overlay — warm navy, NOT pure black */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            160deg,
            rgba(11,23,40,0.96) 0%,
            rgba(22,50,79,0.88) 40%,
            rgba(11,23,40,0.92) 100%
          )`,
        }}
      />

      {/* Subtle gold particle lines */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, rgba(198,161,91,0.5), transparent)',
          animation: 'pulseSlow 2s ease-in-out infinite',
        }}
      />

      {/* Center Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        {/* Logo Mark */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #1F7A68, #16324F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(31,122,104,0.35)',
            animation: 'scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L4 12V28H12V20H20V28H28V12L16 4Z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>

        {/* Brand Name */}
        <div className="cinema-brand-text">
          Real<span style={{ color: '#C6A15B' }}>Flow</span>
        </div>

        {/* Thin separator line */}
        <div
          style={{
            width: '48px',
            height: '1px',
            background: 'rgba(198,161,91,0.6)',
            animation: 'slideUpFade 0.6s cubic-bezier(0.22,1,0.36,1) 1.1s both',
          }}
        />

        {/* Tagline */}
        <div className="cinema-tagline">
          Discover Exceptional Spaces
        </div>

        {/* Progress line */}
        <div
          style={{
            marginTop: '2rem',
            width: '160px',
            height: '2px',
            background: 'rgba(255,255,255,0.10)',
            borderRadius: '99px',
            overflow: 'hidden',
            animation: 'slideUpFade 0.6s cubic-bezier(0.22,1,0.36,1) 1.4s both',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #1F7A68, #C6A15B)',
              borderRadius: '99px',
              width: `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Subtle cityline decoration */}
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '10px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            fontFamily: 'Inter, sans-serif',
            animation: 'slideUpFade 0.6s cubic-bezier(0.22,1,0.36,1) 1.6s both',
          }}
        >
          Premium Real Estate Platform
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          fontFamily: 'Inter, sans-serif',
          animation: 'slideUpFade 0.6s cubic-bezier(0.22,1,0.36,1) 2s both',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
          (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
          (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }}
      >
        Skip Intro
      </button>
    </div>
  );
};

/**
 * Returns true if the cinematic intro should be shown this session.
 * Marks it as shown immediately to prevent double-display.
 */
export const shouldShowCinema = (): boolean => {
  try {
    if (sessionStorage.getItem(CINEMA_SESSION_KEY)) return false;
    sessionStorage.setItem(CINEMA_SESSION_KEY, '1');
    return true;
  } catch {
    return false;
  }
};
