'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, handle: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuth = (userData: User, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hackhive_token', tokenData);
      localStorage.setItem('hackhive_user', JSON.stringify(userData));
    }
    // Initialize socket after login
    initSocket(tokenData);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hackhive_token');
      localStorage.removeItem('hackhive_user');
    }
    disconnectSocket();
  };

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('hackhive_token');
    const savedUser = localStorage.getItem('hackhive_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setToken(savedToken);
        initSocket(savedToken);

        // Verify token is still valid
        authApi.getMe()
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem('hackhive_user', JSON.stringify(res.data.user));
          })
          .catch(() => {
            clearAuth();
          })
          .finally(() => setIsLoading(false));
      } catch {
        clearAuth();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAuth(res.data.user, res.data.token);
    toast.success(`Welcome back, ${res.data.user.name}! 🐝`);
  }, []);

  const register = useCallback(async (name: string, handle: string, email: string, password: string) => {
    const res = await authApi.register({ name, handle, email, password });
    setAuth(res.data.user, res.data.token);
    toast.success(`Welcome to HackHive, ${res.data.user.name}! 🎉`);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    toast.success('Logged out successfully');
    window.location.href = '/auth/login';
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hackhive_user', JSON.stringify(updatedUser));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
