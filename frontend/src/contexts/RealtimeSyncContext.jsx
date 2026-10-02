import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import io from 'socket.io-client';

const RealtimeSyncContext = createContext();

export function RealtimeSyncProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState([]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Real-time sync connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Real-time sync disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.io error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Add event handler
  const on = useCallback((event, callback) => {
    if (!socket) return;
    socket.on(event, (data) => {
      console.log(`📡 Real-time event: ${event}`, data);
      setRecentUpdates((prev) => [
        { event, timestamp: new Date(), data },
        ...prev.slice(0, 19),
      ]);
      callback(data);
    });
  }, [socket]);

  // Remove event handler
  const off = useCallback((event) => {
    if (!socket) return;
    socket.off(event);
  }, [socket]);

  // Emit event
  const emit = useCallback((event, data) => {
    if (!socket) return;
    socket.emit(event, data);
  }, [socket]);

  return (
    <RealtimeSyncContext.Provider value={{ socket, connected, on, off, emit, recentUpdates }}>
      {children}
    </RealtimeSyncContext.Provider>
  );
}

export function useRealtimeSync() {
  const context = useContext(RealtimeSyncContext);
  if (!context) {
    throw new Error('useRealtimeSync must be used within RealtimeSyncProvider');
  }
  return context;
}
