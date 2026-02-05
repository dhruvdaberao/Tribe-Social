






import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation, User, Message, Post } from '../../types';
import ConversationList from './ConversationList';
import { MessageArea } from './MessageArea';
import NewMessageModal from './NewMessageModal';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from '../common/Toast';
import { safeSetItem } from '../../utils/safeLocalStorage';

interface ChatPageProps {
  currentUser: User;
  allUsers: User[];
  chukUser: User;
  initialTargetUser: User | null;
  onViewProfile: (user: User) => void;
  onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
  onConversationStateChange?: (isOpen: boolean) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers, chukUser, initialTargetUser, onViewProfile, onSharePost, onConversationStateChange }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = localStorage.getItem('tribe_storage_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Only show loading if we have NO cached conversations
  const [isLoadingConversations, setIsLoadingConversations] = useState(() => {
    return !localStorage.getItem('tribe_storage_conversations');
  });
  const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);
  const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!initialTargetUser);
  // Cache for messages: key is conversationId (or otherUserId), value is Message[]
  const messageCache = React.useRef<Map<string, Message[]>>(new Map());
  const { socket, onlineUsers, clearUnreadMessages, unreadCounts, setActiveChatPartnerId } = useSocket();

  useEffect(() => {
    // When ChatPage is unmounted (e.g., user navigates away),
    // ensure we clear the active chat partner ID so notifications resume correctly.
    return () => {
      setActiveChatPartnerId(null);
    };
  }, [setActiveChatPartnerId]);

  // Notify parent about conversation state (for header visibility)
  useEffect(() => {
    onConversationStateChange?.(!!activeConversation);
  }, [activeConversation, onConversationStateChange]);

  const userMap = useMemo(() => {
    const map = new Map(allUsers.map(user => [user.id, user]));
    map.set(chukUser.id, chukUser);
    return map;
  }, [allUsers, chukUser]);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const { data } = await api.fetchConversations();
      setConversations(data);
      // Update cache
      safeSetItem('tribe_storage_conversations', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Failed to fetch conversations", error);
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1️⃣ Cache loaded in initial state.
    // 2️⃣ Fetch fresh data in background
    fetchConversations().then(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, [fetchConversations]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      const isActiveConversation = (activeConversation?.participants.some(p => p.id === message.senderId) && activeConversation?.participants.some(p => p.id === message.receiverId));

      // Update Cache First
      const senderId = message.senderId;
      const receiverId = message.receiverId;
      const otherUserId = senderId === currentUser.id ? receiverId : senderId;

      const cached = messageCache.current.get(otherUserId) || [];
      // Avoid duplicates in cache
      if (!cached.some(m => m.id === message.id)) {
        messageCache.current.set(otherUserId, [...cached, message]);
      }

      if (isActiveConversation) {
        setMessages(prev => {
          // 🔥 Deduplication Logic
          const messageMap = new Map();
          prev.forEach(m => messageMap.set(m.id, m));
          messageMap.set(message.id, message);

          // Handle Optimistic Replacement if applicable
          if ((message as any).tempId) {
            const tempKey = `temp-${(message as any).tempId}`;
            if (messageMap.has(tempKey)) {
              messageMap.delete(tempKey);
              messageMap.set(message.id, message);
            }
          }

          return Array.from(messageMap.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }

      setConversations(prev => {
        const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
        const convoIndex = prev.findIndex(c => c.participants.some(p => p.id === otherUserId));

        if (convoIndex > -1) {
          const updatedConvo = { ...prev[convoIndex], lastMessage: message.text, timestamp: message.timestamp };
          const restConvos = [...prev.slice(0, convoIndex), ...prev.slice(convoIndex + 1)];
          return [updatedConvo, ...restConvos];
        } else {
          const newConvo = { id: `conv-${otherUserId}`, participants: [{ id: currentUser.id }, { id: otherUserId }], lastMessage: message.text, timestamp: message.timestamp, messages: [] };
          return [newConvo, ...prev];
        }
      });
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, activeConversation, currentUser.id]);


  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);

    const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;

    setActiveChatPartnerId(otherUserId);
    clearUnreadMessages(otherUserId);

    // Join logic: Only if socket is ready
    if (socket && socket.connected) {
      socket.emit('joinRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    } else {
      // Queue it or let the 'connect' handler in useEffect deal with it if we tracked active room there
      // For now, we rely on the user finding it works when they are online
    }

    // AI Check
    if (otherUserId === chukUser.id) {
      setMessages([{ id: 'chuk-intro', senderId: chukUser.id, receiverId: currentUser.id, text: `Psy... Hi ${currentUser.name.split(' ')[0]}! I'm Psyduck! What's on your mind? ...Psy? 🦆`, timestamp: new Date().toISOString() }]);
      setMessageAreaVisible(true);
      setIsInitializing(false); // Clear loading state
      return;
    }

    // CHECK CACHE FIRST
    const cachedMessages = messageCache.current.get(otherUserId);
    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
      setMessageAreaVisible(true);
      // Optional: Background refresh if needed, but for now trust cache + socket
      setIsLoadingMessages(false);
    } else {
      setIsLoadingMessages(true);
      setMessageAreaVisible(true); // Show area immediately even if loading
      try {
        const { data } = await api.fetchMessages(otherUserId);
        // Update Cache
        messageCache.current.set(otherUserId, data);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  }, [currentUser.id, currentUser.name, chukUser.id, socket, clearUnreadMessages, setActiveChatPartnerId]);

  const handleStartNewConversation = useCallback((targetUser: User) => {
    if (targetUser.id === chukUser.id) {
      handleSelectConversation({ id: chukUser.id, participants: [{ id: currentUser.id }, { id: chukUser.id }], lastMessage: "AI Assistant", timestamp: new Date().toISOString(), messages: [] });
      return;
    }

    const existingConvo = conversations.find(c => c.participants.some(p => p.id === targetUser.id));
    if (existingConvo) {
      handleSelectConversation(existingConvo);
    } else {
      const tempConvo: Conversation = { id: `temp-${targetUser.id}`, participants: [{ id: currentUser.id }, { id: targetUser.id }], messages: [], lastMessage: `Start a conversation with ${targetUser.name}`, timestamp: new Date().toISOString() };
      setActiveConversation(tempConvo);
      setMessages([]);
      setMessageAreaVisible(true);
      socket?.emit('joinRoom', `dm-${[currentUser.id, targetUser.id].sort().join('-')}`);
    }
  }, [conversations, currentUser.id, handleSelectConversation, chukUser.id, socket]);

  useEffect(() => {
    if (initialTargetUser && !activeConversation) {
      setIsInitializing(true);
      handleStartNewConversation(initialTargetUser);
      // Fallback timeout in case initialization stalls
      const timeout = setTimeout(() => setIsInitializing(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [initialTargetUser?.id]); // Only depend on ID to prevent re-runs

  const handleBackToList = () => {
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) socket?.emit('leaveRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    }
    setActiveChatPartnerId(null);
    setActiveConversation(null);
    setMessageAreaVisible(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation || isSending) return;
    setIsSending(true);
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) {
      setIsSending(false);
      return;
    }
    const tempMessage: Message = { id: `temp-${Date.now()}`, senderId: currentUser.id, receiverId: otherUserId, text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMessage]);

    if (otherUserId === chukUser.id) {
      try {
        const { data } = await api.generateAiChat({ prompt: text });
        const chukResponse: Message = { id: `chuk-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: data.text, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, chukResponse]);
      } catch (error) {
        console.error("Chuk AI Error:", error);
        const errorMessage: Message = { id: `chuk-err-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: "Psy... yi... yi... headache... I can't think right now... Psy! 🌀", timestamp: new Date().toISOString() };
        setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, errorMessage]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    try {
      // 🔥 Send Temp ID to backend so it can be returned
      await api.sendMessage(otherUserId, { message: text, tempId: tempMessage.id.replace('temp-', '') } as any);

      if (activeConversation.id.startsWith('temp-')) {
        const newConversations = await fetchConversations();
        const newConvo = newConversations.find((c: Conversation) => c.participants.some(p => p.id === otherUserId));
        if (newConvo) {
          setActiveConversation({
            ...newConvo,
            messages: messages
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to send message", error);
      const serverMsg = error.response?.data?.message || "Connection failed";
      toast.error(`Send Failed: ${serverMsg}`);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setIsSending(false);
    }

    // We rely on socket for the update to replace the temporary message, 
    // OR we could manually replace it here if API returned the message object. 
    // api.sendMessage usually returns { success: true, data: Message } but need to check API.
    // Assuming for now socket is the primary delivery mechanism for consistency.
  };

  return (
    // Removed rounded corners here (md:rounded-2xl)
    <div className="h-full bg-surface md:border md:border-border md:shadow-lg flex overflow-hidden relative">

      <div
        className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 z-10 md:border-r md:border-border bg-surface ${isMessageAreaVisible ? '-translate-x-full' : 'translate-x-0'
          } md:translate-x-0`}
      >
        <ConversationList conversations={conversations} isLoading={isLoadingConversations} currentUser={currentUser} chukUser={chukUser} userMap={userMap} activeConversationId={activeConversation?.id} onSelectConversation={handleSelectConversation} onNewMessage={() => setNewMessageModalOpen(true)} unreadCounts={unreadCounts.messages} />
      </div>

      <div
        className={`w-full md:flex-1 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 bg-background ${isMessageAreaVisible ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0`}
      >
        {activeConversation ? (
          <MessageArea key={activeConversation.id} conversation={activeConversation} messages={messages} isLoading={isLoadingMessages} currentUser={currentUser} userMap={userMap} isSending={isSending} onSendMessage={handleSendMessage} onBack={handleBackToList} onViewProfile={onViewProfile} />
        ) : isInitializing ? (
          <div className="flex w-full h-full flex-col items-center justify-center text-center p-8">
            <img src="/duckload.gif" alt="Loading..." className="w-20 h-20 mb-4" />
            <p className="text-secondary text-lg">Loading Psyduck chat...</p>
          </div>
        ) : (
          <div className="flex w-full h-full flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 text-secondary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h2 className="text-[28px] font-bold text-primary font-display leading-[1.2]">Your Messages</h2>
            <p className="text-secondary mt-2">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>
      {isNewMessageModalOpen && (
        <NewMessageModal allUsers={allUsers.filter(u => u.id !== currentUser.id)} onClose={() => setNewMessageModalOpen(false)} onUserSelect={(user) => { setNewMessageModalOpen(false); handleStartNewConversation(user); }} />
      )}
    </div>
  );
};

export default ChatPage;