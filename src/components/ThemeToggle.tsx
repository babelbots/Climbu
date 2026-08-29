import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ compact?: boolean; className?: string }> = ({ 
  compact = false,
  className = '' 
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('boulder-alhama-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('boulder-alhama-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('boulder-alhama-theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  if (compact) {
    return (
      <button
        onClick={toggle}
        id="theme-toggle-compact-btn"
        className={`w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95 ${className}`}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
      >
        {isDark ? <Sun className="w-4 h-4 text-[#E8C96A]" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      id="theme-toggle-btn"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all active:scale-95 border border-[var(--border-color)] ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#E8C96A]" />
          <span>Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5" />
          <span>Oscuro</span>
        </>
      )}
    </button>
  );
};
