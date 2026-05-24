'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** The user's selection (may be "system"). */
  theme: ThemeChoice;
  /** The actually-applied theme after resolving "system". */
  resolved: 'light' | 'dark';
  setTheme: (t: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(choice: ThemeChoice) {
  if (typeof document === 'undefined') return;
  const dark = choice === 'dark' || (choice === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  // Initialise from storage on mount (the no-flash script already applied the class).
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice | null) ?? 'system';
    setThemeState(stored);
    apply(stored);
    setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  // React to OS theme changes while in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as ThemeChoice | null ?? 'system') === 'system') {
        apply('system');
        setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    apply(t);
    setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
