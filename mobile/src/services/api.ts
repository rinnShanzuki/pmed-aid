import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseURL } from '../config/api.config';

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - inject Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error(`API Error: ${status} ${url}`, error.message);
    
    if (status === 401) {
      // Token is invalid or expired - remove it
      console.log('Unauthorized - removing token');
      await AsyncStorage.removeItem('token');
      // The next checkAuth call will detect no token and redirect to login
    }
    
    return Promise.reject(error);
  }
);

export default api;
