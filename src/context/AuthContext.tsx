import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { AuthUser, LoginResponse } from '../types/emailAlert';
import { apiFetch } from '../services/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('email_alert_user');
    return stored ? JSON.parse(stored) as AuthUser : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('email_alert_access_token')) {
      setLoading(false);
      return;
    }
    void apiFetch('/api/auth/me').then(async (response) => {
      if (!response.ok) {
        setUser(null);
        return;
      }
      const currentUser = await response.json() as AuthUser;
      setUser(currentUser);
      localStorage.setItem('email_alert_user', JSON.stringify(currentUser));
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(response.status === 401 ? 'Invalid email or password.' : 'Unable to sign in.');
    const result = await response.json() as LoginResponse;
    localStorage.setItem('email_alert_access_token', result.access_token);
    localStorage.setItem('email_alert_user', JSON.stringify(result.user));
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('email_alert_access_token');
    localStorage.removeItem('email_alert_user');
    setUser(null);
    window.location.assign('/login');
  };

  return <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout, hasPermission: (permission) => Boolean(user?.permissions.includes(permission)) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}