import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary } from '@campusfind/shared';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  login: (token: string, user: UserSummary) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify with backend
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        }).then((res) => {
          if (!res.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else {
            res.json().then((currentUser) => {
              if (currentUser) {
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
              }
            });
          }
        }).catch(() => {
          // Keep offline or fail gracefully
        });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  const login = (newToken: string, newUser: UserSummary) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
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
