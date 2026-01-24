import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Notification, Message, TribeMessage, User } from '../types';
import { toast } from '../components/common/Toast';

const SOCKET_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5001'
  : 'https://tribe-social-backend.onrender.com';

/* ───────────── SOCKET EVENT TYPES ───────────── */

interface ServerToClientEvents {
  connect: () => void;
  getOnlineUsers: (users: string[]) => void;

  // Notifications & messages
  newNotification: (notification: Notification) => void;
  newMessage: (message: Message) => void;

  // 🔥 REAL-TIME TRIBE CHAT
  newTribeMessage: (message: TribeMessage) => void;

  // 🔥 OPTION B: USER-SCOPED UNREAD EVENTS
  tribeUnread: (data: { tribeId: string }) => void;
  tribeMessageDeleted: (data: { tribeId: string; messageId: string }) => void;

  // Other app-wide events
  newPost: (post: any) => void;
  postUpdated: (post: any) => void;
  postDeleted: (postId: string) => void;

  tribeDeleted: (tribeId: string) => void;
  userUpdated: (user: User) => void;
}


interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

/* ───────────── CONTEXT TYPE ───────────── */

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  onlineUsers: string[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  unreadCounts: {
    messages: Record<string, number>;
    tribes: Record<string, number>;
  };

  unreadMessageCount: number;
  unreadTribeCount: number;
  unreadNotificationCount: number;

  clearUnreadMessages: (partnerId: string) => void;
  clearUnreadTribe: (tribeId: string) => void;

  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setActiveChatPartnerId: (partnerId: string | null) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

/* ───────────── PROVIDER ───────────── */

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const socketRef =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null); // 🔥 New State

  const [unreadCounts, setUnreadCounts] = useState({
    messages: {} as Record<string, number>,
    tribes: {} as Record<string, number>
  });

  /* ───────────── CREATE SOCKET ONCE ───────────── */
  useEffect(() => {
    if (!currentUser) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: { userId: currentUser.id },
        withCredentials: true
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);

        // 🔥 JOIN USER-SCOPED ROOM (OPTION B)
        socket.emit('joinRoom', `user-${currentUser.id}`);
      });

      socket.on('getOnlineUsers', setOnlineUsers);

      /* ───────────── NOTIFICATIONS ───────────── */
      socket.on('newNotification', notification => {
        if (notification.sender.id === currentUser.id) return;
        setNotifications(prev => [notification, ...prev]);
        toast.info(`${notification.sender.name} sent a notification`);
      });

      /* ───────────── DIRECT MESSAGE UNREAD ───────────── */
      /* ───────────── DIRECT MESSAGE UNREAD ───────────── */
      socket.on('newMessage', message => {
        if (message.senderId === currentUser.id) return;

        // Use functional state update or ref to check current active partner
        setActiveChatPartnerId(current => {
          if (current === message.senderId) return current; // Don't increment if open

          setUnreadCounts(prev => ({
            ...prev,
            messages: {
              ...prev.messages,
              [message.senderId]:
                (prev.messages[message.senderId] || 0) + 1
            }
          }));
          return current;
        });
      });

      /* ───────────── 🔥 TRIBE UNREAD (OPTION B) ───────────── */
      socket.on('tribeUnread', ({ tribeId }) => {
        setUnreadCounts(prev => ({
          ...prev,
          tribes: {
            ...prev.tribes,
            [tribeId]: (prev.tribes[tribeId] || 0) + 1
          }
        }));
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  /* ───────────── HELPERS ───────────── */
  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('joinRoom', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leaveRoom', roomId);
  }, []);

  const clearUnreadMessages = useCallback((partnerId: string) => {
    setUnreadCounts(prev => {
      const next = { ...prev.messages };
      delete next[partnerId];
      return { ...prev, messages: next };
    });
  }, []);

  const clearUnreadTribe = useCallback((tribeId: string) => {
    setUnreadCounts(prev => {
      const next = { ...prev.tribes };
      delete next[tribeId];
      return { ...prev, tribes: next };
    });
  }, []);

  const unreadMessageCount = Object.values(unreadCounts.messages).reduce(
    (a, b) => a + b,
    0
  );
  const unreadTribeCount = Object.values(unreadCounts.tribes).reduce(
    (a, b) => a + b,
    0
  );
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        notifications,
        setNotifications,
        unreadCounts,
        unreadMessageCount,
        unreadTribeCount,
        unreadNotificationCount,
        clearUnreadMessages,
        clearUnreadTribe,
        joinRoom,
        leaveRoom,
        setActiveChatPartnerId
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
