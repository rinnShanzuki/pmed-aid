import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: ping /auth/me — if cookie valid, restore session
  useEffect(() => {
    fetchCurrentUser();

    // Listen for 401 events from api interceptor
    const handler = () => {
      localStorage.removeItem('token');
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [fetchCurrentUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  }, []);

  const googleAuth = useCallback(async (googleData) => {
    const { data } = await api.post('/auth/google', googleData);
    if (data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  }, []);

  const qrBind = useCallback(async (payload) => {
    const { data } = await api.post('/auth/qr-bind', payload);
    if (data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    setUser(data.data.user);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  // Role → default redirect path
  const ROLE_REDIRECTS = {
    admin:      '/admin',
    info_desk:  '/info-desk',
    doctor:     '/doctor',
    nurse:      '/nurse',
    patient:    '/patient',
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleAuth, qrBind, logout, ROLE_REDIRECTS }}>
      {children}
    </AuthContext.Provider>
  );
}
