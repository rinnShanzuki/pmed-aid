import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  emit: (event: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || !token) return;

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      
      const newSocket = io(API_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket.io connected (Mobile)');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected (Mobile)');
        setConnected(false);
      });

      newSocket.on('connect_error', (error: Error) => {
        console.warn('⚠️ Socket.io error:', error.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize Socket.io:', error);
    }
  }, [user, token]);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (!socket) return;
    socket.on(event, (data) => {
      console.log(`📡 Real-time event (Mobile): ${event}`, data);
      callback(data);
    });
  }, [socket]);

  const off = useCallback((event: string) => {
    if (!socket) return;
    socket.off(event);
  }, [socket]);

  const emit = useCallback((event: string, data?: any) => {
    if (!socket) return;
    socket.emit(event, data);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
