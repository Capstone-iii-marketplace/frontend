import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isLoading } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Wait for /me to resolve — connecting before we know who's signed in
    // means the handshake fires without a session and gets rejected.
    if (isLoading || !user) return;

    const s = io(import.meta.env.VITE_API_URL, {
      // Sends the jwt cookie with the handshake; the server reads it in io.use.
      withCredentials: true,
    });

    s.on('connect', () => console.log('socket connected', s.id));
    s.on('connect_error', (err) => console.error('socket error:', err.message));

    setSocket(s);

    // Runs on logout and on unmount — without this every re-run leaks a
    // connection the server never closes.
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user, isLoading]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

// const socket = useSocket();  // null until connected — guard before using
export function useSocket() {
  return useContext(SocketContext);
}