import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';
import * as api from '../api.ts';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (user: any): User | null => {
    if (!user) return null;
    return {
        ...user,
        followers: user.followers || [],
        following: user.following || [],
        blockedUsers: user.blockedUsers || [],
    };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for user session on initial load
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('currentUser');
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(normalizeUser(user));
        } catch (error) {
           console.error("Failed to parse stored user:", error);
           localStorage.removeItem('token');
           localStorage.removeItem('currentUser');
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  // Persist currentUser to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);


  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    setCurrentUser(normalizeUser(data.user));
  }, []);

  const register = useCallback(async (name: string, username: string, email: string, password: string) => {
    const { data } = await api.register({ name, username, email, password });
    localStorage.setItem('token', data.token);
    setCurrentUser(normalizeUser(data.user));
  }, []);
  
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // Optional: force a full page reload to clear all state
    window.location.href = '/';
  }, []);

  const value = useMemo(() => ({
      currentUser,
      setCurrentUser,
      login,
      register,
      logout,
      isLoading
  }), [currentUser, isLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};