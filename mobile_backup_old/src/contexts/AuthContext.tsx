import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  qrBind: (payload: any) => Promise<any>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    }
    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // DISABLED: Auto-login removed - user must login every time
      // const token = await AsyncStorage.getItem('token');
      // if (!token) {
      //   setUser(null);
      //   setLoading(false);
      //   return;
      // }
      
      // // Set auth header
      // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // const { data } = await api.get('/auth/me');
      // setUser(data.data.user);
      
      setUser(null);
      setLoading(false);
    } catch (error: any) {
      // Silent fail - just clear auth
      await AsyncStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    // DEV ONLY: Uncomment to clear auth on hot reload during development
    // if (__DEV__) {
    //   AsyncStorage.removeItem('token');
    //   setUser(null);
    //   setLoading(false);
    // }
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data.token) {
      await AsyncStorage.setItem('token', data.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    }
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  }, []);

  const qrBind = useCallback(async (payload: any) => {
    const { data } = await api.post('/auth/qr-bind', payload);
    if (data.data.token) {
      await AsyncStorage.setItem('token', data.data.token);
    }
    setUser(data.data.user);
    return data.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, qrBind, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
