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

  // Typing
  userTyping: (data: { userName: string, userId: string }) => void;
  userStoppedTyping: (data: { userName: string, userId: string }) => void;
}


interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  typing: (data: { roomId: string, userName: string, userId: string }) => void;
  stopTyping: (data: { roomId: string, userName: string, userId: string }) => void;
}

/* ───────────── CONTEXT TYPE ───────────── */

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean; // 🔥 Added
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

  const [isConnected, setIsConnected] = useState(false); // 🔥 Added
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);

  const [unreadCounts, setUnreadCounts] = useState({
    messages: {} as Record<string, number>,
    tribes: {} as Record<string, number>
  });

  /* ───────────── CREATE SOCKET ONCE ───────────── */
  useEffect(() => {
    if (!currentUser) return;

    if (!socketRef.current) {
      console.log("🔌 Initializing Socket.IO connection...");
      socketRef.current = io(SOCKET_URL, {
        auth: { userId: currentUser.id },
        withCredentials: true,
        reconnection: true,             // Enable reconnection
        reconnectionAttempts: 10,       // Retry 10 times
        reconnectionDelay: 1000,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setIsConnected(true);
        // User room is auto-joined by backend in new logic, but redundant join is safe
        socket.emit('joinRoom', `user-${currentUser.id}`);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('⚠️ Socket connect error:', err.message);
        setIsConnected(false);
      });

      socket.on('getOnlineUsers', setOnlineUsers);

      /* ───────────── NOTIFICATIONS ───────────── */
      socket.on('newNotification', notification => {
        if (notification.sender.id === currentUser.id) return;
        setNotifications(prev => {
          if (prev.some(n => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
        toast.info(`${notification.sender.name} sent a notification`);
      });

      /* ───────────── DIRECT MESSAGE UNREAD ───────────── */
      socket.on('newMessage', message => {
        // If I sent it, ignore unread count
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
      // Don't disconnect on every re-render, only on explicit unmount/logout
      // But for strict cleanup in React 18:
      // socketRef.current?.disconnect();
      // socketRef.current = null;
    };
  }, [currentUser]);

  // Clean disconnect on unmount of Provider (app exit)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket on cleanup...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }
  }, []);

  /* ───────────── HELPERS ───────────── */
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`📤 Emitting joinRoom: ${roomId}`);
      socketRef.current.emit('joinRoom', roomId);
    } else {
      console.warn(`⚠️ Cannot join room ${roomId}: Socket not connected`);
      // TODO: Implement queueing if strictly needed, but usually retrying on 'connect' event in component is better
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      console.log(`📤 Emitting leaveRoom: ${roomId}`);
      socketRef.current.emit('leaveRoom', roomId);
    }
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
        isConnected,
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
