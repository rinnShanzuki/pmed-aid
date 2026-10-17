import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Linking } from 'react-native';

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  qrBind: (payload: any) => Promise<any>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    }
    // Clear token and cached user IMMEDIATELY before auth check
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Check if we're being launched from a deep link (QR code)
      const initialURL = await Linking.getInitialURL();
      if (initialURL != null) {
        console.log('Initial URL detected:', initialURL);
        // Don't auto-login when launched from deep link
        setUser(null);
        setLoading(false);
        return;
      }

      // Auto-login with stored token (only if not from QR code)
      const token = await AsyncStorage.getItem('token');
      const savedUserStr = await AsyncStorage.getItem('user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

      if (!token) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      
      // Try to verify token with shorter timeout (2 seconds instead of 5)
      try {
        const { data } = await Promise.race<any>([
          api.get('/auth/me'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        if (data?.data?.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
          setUser(data.data.user);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (verifyError) {
        console.warn('Could not verify token with backend:', verifyError);
        if (savedUser && savedUser.role) {
          setUser(savedUser);
        } else {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    } catch (error: any) {
      // Silent fail - just clear auth
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data.token) {
      await AsyncStorage.setItem('token', data.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
      setToken(data.data.token);
    }
    if (data.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
    }
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  }, []);

  const qrBind = useCallback(async (payload: any) => {
    const { data } = await api.post('/auth/qr-bind', payload);
    if (data.data.token) {
      await AsyncStorage.setItem('token', data.data.token);
      setToken(data.data.token);
    }
    if (data.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
    }
    setUser(data.data.user);
    return data.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, qrBind, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
