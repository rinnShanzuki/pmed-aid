import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // We assume the user is authenticated and the cookie is sent automatically,
    // but we can also extract token from localStorage if this app uses it.
    // For this app, `withCredentials: true` is enough if auth is cookie-based.

    // Check if token exists in cookies
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const token = getCookie('token') || localStorage.getItem('token');

    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
