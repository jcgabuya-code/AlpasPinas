import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { PromoBar } from './PromoBar';
import { Footer } from './Footer';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';

/**
 * Shared layout for all routed pages — renders Navigation at the top, the
 * active route via <Outlet />, and Footer at the bottom.
 */
export const Layout: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];

  return (
    <div
      style={{
        backgroundColor: c.background,
        color: c.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PromoBar />
      <Navigation />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
