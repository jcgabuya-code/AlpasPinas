import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../utils/users';
import { getCurrentUser, registerUser, loginUser, logoutUser, subscribeAuth } from '../utils/users';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (mobile: string, name: string, email: string | undefined, birthday: string | undefined, password: string) => Promise<void>;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);

    const unsubscribe = subscribeAuth(() => {
      setUser(getCurrentUser());
    });

    return unsubscribe;
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
      setUser(getCurrentUser());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const login = async (mobile: string, password: string) => {
    setError(null);
    try {
      await loginUser(mobile, password);
      setUser(getCurrentUser());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    setError(null);
    logoutUser();
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
