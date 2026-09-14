import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();

  const options: { id: ThemeMode; icon: React.ElementType; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  if (compact) {
    const isDark = resolvedTheme === 'dark';
    return (
      <button
        type="button"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onClick={toggleTheme}
        className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-text-secondary hover:text-primary transition-all shadow-sm flex items-center justify-center group active:scale-95"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>
    );
  }


  return (
    <div className="flex items-center gap-1 bg-surface-secondary/80 border border-border rounded-xl p-1 shadow-sm">
      {options.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={`${label} Mode`}
          onClick={() => setMode(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === id
              ? 'bg-primary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
