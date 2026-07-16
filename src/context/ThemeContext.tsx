import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { colors } from '../styles/colors';
import type { Brand, ColorMode } from '../styles/colors';

// Cycle order for the brand switcher — matches the order palettes are defined.
const BRANDS = Object.keys(colors) as Brand[];   // ['emerald', 'ocean', 'bandila']

// User-facing appearance setting. 'mixed' renders a dark hero over an otherwise
// light page — see `theme` (the effective ColorMode) below.
export type ThemeMode = 'light' | 'dark' | 'mixed';
const MODES: ThemeMode[] = ['dark', 'light', 'mixed'];

interface ThemeContextType {
  // Effective palette mode for general UI. 'mixed' resolves to 'light' here so every
  // component that reads `theme` renders light; the hero/nav read `mode` to opt into
  // the dark treatment where the design calls for it.
  theme: ColorMode;
  // Raw appearance setting, including 'mixed'.
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

  // Mixed pages are light everywhere except the hero, so the general palette is light.
  const theme: ColorMode = mode === 'mixed' ? 'light' : mode;

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
