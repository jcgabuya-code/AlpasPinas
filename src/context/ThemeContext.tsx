import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { colors } from '../styles/colors';
import type { Brand } from '../styles/colors';

// Cycle order for the brand switcher — matches the order palettes are defined.
const BRANDS = Object.keys(colors) as Brand[];   // ['emerald', 'ocean', 'bandila']

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  brand: Brand;
  toggleBrand: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    // Default to dark — matches the AlpasPinas visual direction
    return (saved as Theme) || 'dark';
  });

  const [brand, setBrand] = useState<Brand>(() => {
    const saved = localStorage.getItem('brand');
    // Default to bandila — the v2 royal-blue + crimson-red direction (the Home v2 reference)
    return saved && (BRANDS as string[]).includes(saved) ? (saved as Brand) : 'bandila';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
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
    <ThemeContext.Provider value={{ theme, toggleTheme, brand, toggleBrand }}>
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
