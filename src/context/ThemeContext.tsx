import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { colors } from '../styles/colors';
import type { Brand, ColorMode } from '../styles/colors';

// Cycle order for the brand switcher — matches the order palettes are defined.
const BRANDS = Object.keys(colors) as Brand[];   // ['emerald', 'ocean', 'bandila']

// User-facing appearance setting. Light mode renders a dark hero over an otherwise
// light page; dark mode is dark throughout. (`mode` and `theme` are the same value —
// both are kept so callers that opted into `mode` still read cleanly.)
export type ThemeMode = 'light' | 'dark';
const MODES: ThemeMode[] = ['dark', 'light'];

interface ThemeContextType {
  theme: ColorMode;
  mode: ThemeMode;
  toggleTheme: () => void;
  brand: Brand;
  toggleBrand: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    // Default to dark — matches the AlpasPinas visual direction
    return saved && (MODES as string[]).includes(saved) ? (saved as ThemeMode) : 'dark';
  });

  const [brand, setBrand] = useState<Brand>(() => {
    const saved = localStorage.getItem('brand');
    // Default to bandila — the v2 royal-blue + crimson-red direction (the Home v2 reference)
    return saved && (BRANDS as string[]).includes(saved) ? (saved as Brand) : 'bandila';
  });

  // The general palette follows the setting directly; the hero opts into dark on its
  // own (see LEGACY_LIGHT_HERO), so light mode is a dark hero over a light page.
  const theme: ColorMode = mode;

  // Keep native form controls (scrollbars, date pickers, select arrows) in sync
  // with the app theme — index.css hardcodes color-scheme: dark as the initial
  // paint default (matches the default mode), this overrides it once mounted.
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = MODES[(MODES.indexOf(prev) + 1) % MODES.length];
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const toggleBrand = () => {
    setBrand((prev) => {
      const next = BRANDS[(BRANDS.indexOf(prev) + 1) % BRANDS.length];
      localStorage.setItem('brand', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, brand, toggleBrand }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
