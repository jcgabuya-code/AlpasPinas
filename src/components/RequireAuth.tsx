import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard for login-only pages. Used as a layout route wrapping protected
 * children. While the session is still being checked we render nothing (avoids
 * a flash of the page before a redirect). Unauthenticated visitors are sent to
 * /login with the attempted location in `state.from`, so Login can bounce them
 * back after a successful sign-in.
 */
export const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
};
