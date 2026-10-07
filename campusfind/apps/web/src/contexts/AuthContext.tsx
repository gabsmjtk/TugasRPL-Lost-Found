import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary } from '@campusfind/shared';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  login: (token: string, user: UserSummary) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('campusfind_token');
    const storedUser = localStorage.getItem('campusfind_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('campusfind_token');
        localStorage.removeItem('campusfind_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserSummary) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('campusfind_token', newToken);
    localStorage.setItem('campusfind_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('campusfind_token');
    localStorage.removeItem('campusfind_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
