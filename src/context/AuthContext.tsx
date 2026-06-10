import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../utils/users';
import { getCurrentProfile, loginWithEmail, logout as signOut, onAuthChange, registerUser } from '../utils/users';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  // Legacy direct registration (Sheets) — disabled in the UI; migrated in 3b.
  register: (mobile: string, name: string, email: string | undefined, birthday: string | undefined, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const profile = await getCurrentProfile();
      if (active) {
        setUser(profile);
        setLoading(false);
      }
    };

    refresh();
    // Re-sync whenever Supabase reports a sign-in, sign-out, or token refresh.
    const unsubscribe = onAuthChange(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const register = async (
    mobile: string,
    name: string,
    email: string | undefined,
    birthday: string | undefined,
    password: string,
  ) => {
    setError(null);
    try {
      await registerUser(mobile, name, email, birthday, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await loginWithEmail(email, password);
      setUser(await getCurrentProfile());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
