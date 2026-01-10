// FIX: Removed the custom `declare module 'socket.io-client'` block which was causing type conflicts.
// The project should rely on the official types from the `@types/socket.io-client` package.

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './contexts/AuthContext';
import { Notification, Message, TribeMessage, User } from '../tribe-social2/types';
import { toast } from '../tribe-social2/components/common/Toast';

// Hardcoded the backend URL to remove the dependency on the problematic config file.
const SOCKET_URL = 'https://tribe-social2.onrender.com';

// FIX: Added typed interfaces for socket events to resolve '.on' and '.off' errors.
// FIX: Added 'connect' to ServerToClientEvents to handle the socket connection event.
// FIX: Added a string index signature to satisfy the Socket type constraint.
interface ServerToClientEvents {
  [key: string]: (...args: any[]) => void;
  connect: () => void;
  getOnlineUsers: (users: string[]) => void;
  newNotification: (notification: Notification) => void;
  newMessage: (message: Message) => void;
  newTribeMessage: (message: TribeMessage) => void;
  newPost: (post: any) => void;
  postUpdated: (updatedPost: any) => void;
  postDeleted: (postId: string) => void;
  tribeMessageDeleted: (data: { tribeId: string; messageId: string }) => void;
  userUpdated: (updatedUser: User) => void;
  tribeDeleted: (tribeId: string) => void;
  userTyping: (data: { userName: string; userId: string }) => void;
  userStoppedTyping: (data: { userName: string; userId: string }) => void;
}

// FIX: Added a string index signature to satisfy the Socket type constraint.
interface ClientToServerEvents {
  [key: string]: (...args: any[]) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
  typing: (data: { roomId: string; userName: string; userId: string }) => void;
  stopTyping: (data: { roomId: string; userName: string; userId: string }) => void;
}


interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  onlineUsers: string[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadMessageCount: number;
  unreadTribeCount: number;
  unreadNotificationCount: number;
  unreadCounts: {
    messages: { [key: string]: number };
    tribes: { [key: string]: number };
  };
  clearUnreadMessages: (partnerId: string) => void;
  clearUnreadTribe: (tribeId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// FIX: Refactored from a function declaration to a const component with React.FC to address a children prop type error.
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [unreadCounts, setUnreadCounts] = useState<{
    messages: { [key: string]: number };
    tribes: { [key: string]: number };
  }>({ messages: {}, tribes: {} });

  useEffect(() => {
    if (currentUser) {
      // FIX: Changed 'query' to 'auth' for socket.io-client v3+ to fix connection error.
      const newSocket = io(SOCKET_URL, {
        auth: { userId: currentUser.id },
        withCredentials: true,
      });
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('getOnlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on('newNotification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        toast.info(
            `${notification.sender.name} ${notification.type === 'follow' ? 'started following you' : notification.type === 'like' ? 'liked your post' : 'commented on your post'}.`
        );
    });

    socket.on('newMessage', (message: Message) => {
         setUnreadCounts(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [message.senderId]: (prev.messages[message.senderId] || 0) + 1,
            }
        }));
    });

    socket.on('newTribeMessage', (message: TribeMessage) => {
        if(message.senderId !== currentUser?.id) {
            setUnreadCounts(prev => ({
                ...prev,
                tribes: {
                    ...prev.tribes,
                    [message.tribeId!]: (prev.tribes[message.tribeId!] || 0) + 1,
                }
            }));
        }
    });

    return () => {
      socket.off('connect');
      socket.off('getOnlineUsers');
      socket.off('newNotification');
      socket.off('newMessage');
      socket.off('newTribeMessage');
    };
  }, [socket, currentUser]);

  const clearUnreadMessages = useCallback((partnerId: string) => {
    setUnreadCounts(prev => {
        if (!prev.messages[partnerId]) return prev;
        const newMessages = { ...prev.messages };
        delete newMessages[partnerId];
        return { ...prev, messages: newMessages };
    });
  }, []);

  const clearUnreadTribe = useCallback((tribeId: string) => {
    setUnreadCounts(prev => {
        if (!prev.tribes[tribeId]) return prev;
        const newTribes = { ...prev.tribes };
        delete newTribes[tribeId];
        return { ...prev, tribes: newTribes };
    });
  }, []);

  const unreadMessageCount = Object.values(unreadCounts.messages).reduce((sum: number, count: number) => sum + count, 0);
  const unreadTribeCount = Object.values(unreadCounts.tribes).reduce((sum: number, count: number) => sum + count, 0);
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, notifications, setNotifications, unreadMessageCount, unreadTribeCount, unreadNotificationCount, unreadCounts, clearUnreadMessages, clearUnreadTribe }}>
      {children}
    </SocketContext.Provider>
  );
};