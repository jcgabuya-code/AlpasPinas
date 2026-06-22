import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Brand } from '../styles/colors';

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
    // Default to emerald — the original AlpasPinas brand color
    return saved === 'ocean' ? 'ocean' : 'emerald';
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
      const newBrand: Brand = prev === 'emerald' ? 'ocean' : 'emerald';
      localStorage.setItem('brand', newBrand);
      return newBrand;
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
