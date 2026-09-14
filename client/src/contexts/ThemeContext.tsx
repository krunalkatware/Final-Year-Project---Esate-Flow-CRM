import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  resolvedTheme: 'dark',
  setMode: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'estateflow-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved || 'dark';
  });

  const getSystemTheme = (): 'light' | 'dark' =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const resolvedTheme: 'light' | 'dark' = mode === 'system' ? getSystemTheme() : mode;

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'light', 'dark');
    root.classList.add(`theme-${theme}`, theme);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  };

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
    const target = newMode === 'system' ? getSystemTheme() : newMode;
    applyTheme(target);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

