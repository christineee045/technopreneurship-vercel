import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type User,
  clearAdminToken,
  clearUserToken,
  fetchCurrentUser,
  fetchCurrentUserWithToken,
  loginUser,
  setUserToken,
  signupUser,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('lendly_token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        if (!currentUser.isAdmin) {
          clearAdminToken();
        }
      } catch {
        clearUserToken();
        clearAdminToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('lendly_token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const currentUser = await fetchCurrentUserWithToken(token);
      setUser(currentUser);
    } catch {
      clearUserToken();
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginUser(email, password);
      setUser(result.user);
      setUserToken(result.token);
      if (!result.user.isAdmin) {
        clearAdminToken();
      }
    } catch (err) {
      setUser(null);
      clearUserToken();
      clearAdminToken();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signupUser({ name, email, password });
      setUser(result.user);
      setUserToken(result.token);
      clearAdminToken();
    } catch (err) {
      setUser(null);
      clearUserToken();
      clearAdminToken();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearUserToken();
    clearAdminToken();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
