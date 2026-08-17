import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSocket } from './SocketContext.jsx';

const NotificationContext = createContext(null);

const messageSound = new Audio('/sounds/message.mp3');
messageSound.volume = 0.5;

export function NotificationProvider({ children }) {
  const socket = useSocket();
  // conversationId -> unread count, so the badge can total them and each
  // thread can be cleared independently when it's opened.
  const [unread, setUnread] = useState({});

  const clearThread = useCallback((conversationId) => {
    setUnread((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (payload) => {
         console.log('notification:message received', payload);
      setUnread((prev) => ({
        ...prev,
        [payload.conversationId]: (prev[payload.conversationId] ?? 0) + 1,
      }));

        messageSound.currentTime = 0;
      messageSound.play().catch(() => {
        // Browsers block audio until the user has interacted with the page.
      });

      // Only worth a desktop notification when the tab isn't in front —
      // otherwise the in-app badge already says it.
      if (document.hidden && Notification.permission === 'granted') {
        new Notification(`${payload.sender.name}`, {
          body: payload.body,
          tag: payload.conversationId, // replaces rather than stacks
        });
      }
    };

    socket.on('notification:message', onMessage);
    return () => socket.off('notification:message', onMessage);
  }, [socket]);

  const total = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <NotificationContext.Provider value={{ unread, total, clearThread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}