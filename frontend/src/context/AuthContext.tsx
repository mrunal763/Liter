import React, { createContext, useState, useEffect, useContext } from 'react';

interface UserSession {
  token: string;
  username: string;
  fullName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    // Attempt to restore session from localStorage (30-day retention)
    const savedToken = localStorage.getItem('liter_token');
    const savedUsername = localStorage.getItem('liter_username');
    const savedFullName = localStorage.getItem('liter_fullname');
    const savedTimestamp = localStorage.getItem('liter_session_timestamp');

    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days in milliseconds

    if (savedToken && savedUsername && savedFullName) {
      const isExpired = savedTimestamp ? (Date.now() - Number(savedTimestamp) > ONE_MONTH_MS) : false;

      if (!isExpired) {
        if (!savedTimestamp) {
          localStorage.setItem('liter_session_timestamp', Date.now().toString());
        }
        setUser({
          token: savedToken,
          username: savedUsername,
          fullName: savedFullName
        });
      } else {
        // Expired after 1 month
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const sessionData: UserSession = {
        token: data.token,
        username: data.username,
        fullName: data.fullName
      };

      // Save to localStorage with 30-day session timestamp
      localStorage.setItem('liter_token', data.token);
      localStorage.setItem('liter_username', data.username);
      localStorage.setItem('liter_fullname', data.fullName);
      localStorage.setItem('liter_session_timestamp', Date.now().toString());

      setUser(sessionData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('liter_token');
    localStorage.removeItem('liter_username');
    localStorage.removeItem('liter_fullname');
    localStorage.removeItem('liter_session_timestamp');
    setUser(null);
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const activeToken = user?.token || localStorage.getItem('liter_token');
    
    // Merge headers
    const headers = new Headers(options.headers || {});
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const mergedOptions = {
      ...options,
      headers
    };

    const finalUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const response = await fetch(finalUrl, mergedOptions);

    // Auto-logout if token is expired or invalid
    if (response.status === 401) {
      logout();
    }

    return response;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, authFetch }}>
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
