import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Conversation, User, Message, Post } from '../../types';
import ConversationList from './ConversationList';
import { MessageArea } from './MessageArea';
import ChatShell from './ChatShell';
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
  onToggleBlock: (userId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers, chukUser, initialTargetUser, onViewProfile, onSharePost, onConversationStateChange, onToggleBlock }) => {
  const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
  const navigate = useNavigate();
  const location = useLocation();
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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [autoDeleteMap, setAutoDeleteMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem('dmAutoDelete');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Only show loading if we have NO cached conversations
  const [isLoadingConversations, setIsLoadingConversations] = useState(() => {
    return !localStorage.getItem('tribe_storage_conversations');
  });
  const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);
  const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!initialTargetUser);
  const messageCache = React.useRef<Map<string, { messages: Message[]; hasMore: boolean; oldestTimestamp?: string }>>(new Map());
  const { socket, onlineUsers, clearUnreadMessages, unreadCounts, setActiveChatPartnerId } = useSocket();

  useEffect(() => {
    return () => {
      setActiveChatPartnerId(null);
    };
  }, [setActiveChatPartnerId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('dmAutoDelete', JSON.stringify(autoDeleteMap));
  }, [autoDeleteMap]);

  useEffect(() => {
    onConversationStateChange?.(!!activeConversation);
  }, [activeConversation, onConversationStateChange]);

  const userMap = useMemo(() => {
    const map = new Map(allUsers.map(user => [user.id, user]));
    map.set(chukUser.id, chukUser);
    return map;
  }, [allUsers, chukUser]);

  const sortMessages = useCallback((items: Message[]) => {
    return [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  const mergeResolvedMessage = useCallback((existing: Message[], incoming: Message) => {
    const tempId = incoming.tempId ?? incoming.clientTempId;
    const next = existing.filter(message => {
      if (message.id === incoming.id) return false;
      if (!tempId) return true;
      return message.id !== `temp-${tempId}` && message.clientTempId !== tempId;
    });

    return sortMessages([...next, { ...incoming, status: undefined }]);
  }, [sortMessages]);

  const updateCachedMessages = useCallback((partnerId: string, updater: (existing: Message[]) => Message[]) => {
    const cachedEntry = messageCache.current.get(partnerId);
    const nextMessages = updater(cachedEntry?.messages || []);

    messageCache.current.set(partnerId, {
      messages: nextMessages,
      hasMore: cachedEntry?.hasMore ?? false,
      oldestTimestamp: cachedEntry?.oldestTimestamp,
    });
  }, []);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const { data } = await api.fetchConversations();
      setConversations(data);
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
    fetchConversations().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      const isActiveConversation = (activeConversation?.participants.some(p => p.id === message.senderId) && activeConversation?.participants.some(p => p.id === message.receiverId));
      const senderId = message.senderId;
      const receiverId = message.receiverId;
      const otherUserId = senderId === currentUser.id ? receiverId : senderId;

      updateCachedMessages(otherUserId, cachedMessages => mergeResolvedMessage(cachedMessages, message));

      if (isActiveConversation) {
        setMessages(prev => mergeResolvedMessage(prev, message));
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

    const handleMessageDeleted = ({ messageId, senderId, receiverId }: { messageId: string; senderId: string; receiverId: string }) => {
      const otherUserId = senderId === currentUser.id ? receiverId : senderId;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      const cachedEntry = messageCache.current.get(otherUserId);
      if (cachedEntry) {
        messageCache.current.set(otherUserId, { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) });
      }
    };

    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, activeConversation, currentUser.id, mergeResolvedMessage, updateCachedMessages]);


  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);

    const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;

    setActiveChatPartnerId(otherUserId);
    clearUnreadMessages(otherUserId);

    if (socket && socket.connected) {
      socket.emit('joinRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    }

    if (otherUserId === chukUser.id) {
      setMessages([{ id: 'chuk-intro', senderId: chukUser.id, receiverId: currentUser.id, text: `Psy... Hi ${currentUser.name.split(' ')[0]}! I'm Psyduck! What's on your mind? ...Psy? 🦆`, timestamp: new Date().toISOString() }]);
      setMessageAreaVisible(true);
      setIsInitializing(false);
      return;
    }

    const cachedEntry = messageCache.current.get(otherUserId);
    if (cachedEntry?.messages && cachedEntry.messages.length > 0) {
      setMessages(cachedEntry.messages);
      setHasMoreMessages(cachedEntry.hasMore);
      setMessageAreaVisible(true);
      setIsLoadingMessages(false);
    } else {
      setIsLoadingMessages(true);
      setMessageAreaVisible(true);
      try {
        const { data } = await api.fetchMessages(otherUserId, { limit: 50 });
        const hasMore = data.length === 50;
        const oldestTimestamp = data[0]?.timestamp;
        messageCache.current.set(otherUserId, { messages: data, hasMore, oldestTimestamp });
        setMessages(data);
        setHasMoreMessages(hasMore);
      } catch (error) {
        console.error("Failed to fetch messages", error);
        setMessages([]);
        setHasMoreMessages(false);
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
      const timeout = setTimeout(() => setIsInitializing(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [initialTargetUser?.id]);

  const handleBackToList = () => {
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) socket?.emit('leaveRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    }
    setActiveChatPartnerId(null);
    setActiveConversation(null);
    setMessageAreaVisible(false);

    // If we're on /psyduck route, navigate back to /messages so nav bars reappear
    if (location.pathname.startsWith('/psyduck')) {
      navigate('/messages', { replace: true });
    }
  };

  const handleLoadMoreMessages = useCallback(async () => {
    if (!activeConversation || isLoadingMore || !hasMoreMessages) return;
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;

    const cachedEntry = messageCache.current.get(otherUserId);
    const before = cachedEntry?.oldestTimestamp;
    if (!before) return;

    setIsLoadingMore(true);
    try {
      const { data } = await api.fetchMessages(otherUserId, { limit: 50, before });
      const nextMessages = [...data, ...(cachedEntry?.messages || [])];
      const nextHasMore = data.length === 50;
      const oldestTimestamp = data[0]?.timestamp || cachedEntry?.oldestTimestamp;
      messageCache.current.set(otherUserId, { messages: nextMessages, hasMore: nextHasMore, oldestTimestamp });
      setMessages(nextMessages);
      setHasMoreMessages(nextHasMore);
    } catch (error) {
      console.error("Failed to load older messages", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeConversation, hasMoreMessages, isLoadingMore]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sendMessageWithSocket = useCallback(async (payload: {
    receiverId: string;
    message?: string;
    tempId?: string;
    attachment?: { data: string; type: string; name?: string; size?: number } | null;
    replyTo?: string | null;
  }) => {
    if (!socket || !socket.connected) return null;
    return new Promise<Message>((resolve, reject) => {
      socket.timeout(15000).emit('sendMessage', payload, (err: Error | null, response: { ok: boolean; message?: Message; error?: string }) => {
        if (err || !response?.ok || !response.message) {
          reject(new Error(response?.error || 'Socket send failed'));
          return;
        }
        resolve(response.message);
      });
    });
  }, [socket]);

  const handleSendMessage = async (payload: { text?: string; attachment?: File; replyTo?: string | null }) => {
    if (!activeConversation || isSending || isUploading) return;
    const text = payload.text?.trim() || '';
    const attachmentFile = payload.attachment;
    const replyTo = payload.replyTo || null;
    if (!text && !attachmentFile) return;
    if (attachmentFile && attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      toast.error('Attachment must be 20MB or less.');
      return;
    }

    setIsSending(true);
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) {
      setIsSending(false);
      return;
    }
    if (otherUserId === chukUser.id && attachmentFile) {
      toast.error('Attachments are not supported in Psyduck chat.');
      setIsSending(false);
      return;
    }
    const tempId = `${Date.now()}`;
    const tempMessage: Message = {
      id: `temp-${tempId}`,
      tempId,
      senderId: currentUser.id,
      receiverId: otherUserId,
      text,
      timestamp: new Date().toISOString(),
      replyTo,
      status: 'sending',
      clientTempId: tempId,
      attachmentUrl: attachmentFile ? URL.createObjectURL(attachmentFile) : undefined,
      attachmentType: attachmentFile?.type,
      attachmentName: attachmentFile?.name,
      attachmentSize: attachmentFile?.size,
    };
    setMessages(prev => sortMessages([...prev, tempMessage]));
    updateCachedMessages(otherUserId, cachedMessages => sortMessages([...cachedMessages, tempMessage]));

    if (otherUserId === chukUser.id) {
      try {
        const { data } = await api.generateAiChat({ prompt: text });
        const chukResponse: Message = { id: `chuk-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: data.text, timestamp: new Date().toISOString() };
        const sentMessage: Message = { ...tempMessage, status: undefined };
        setMessages(prev => sortMessages([...prev.filter(message => message.id !== tempMessage.id), sentMessage, chukResponse]));
        updateCachedMessages(otherUserId, cachedMessages => sortMessages([...cachedMessages.filter(message => message.id !== tempMessage.id), sentMessage, chukResponse]));
      } catch (error) {
        console.error("Chuk AI Error:", error);
        const errorMessage: Message = { id: `chuk-err-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: "Psy... yi... yi... headache... I can't think right now... Psy! 🌀", timestamp: new Date().toISOString() };
        const sentMessage: Message = { ...tempMessage, status: undefined };
        setMessages(prev => sortMessages([...prev.filter(message => message.id !== tempMessage.id), sentMessage, errorMessage]));
        updateCachedMessages(otherUserId, cachedMessages => sortMessages([...cachedMessages.filter(message => message.id !== tempMessage.id), sentMessage, errorMessage]));
      } finally {
        setIsSending(false);
      }
      return;
    }

    try {
      let attachmentPayload = null;
      if (attachmentFile) {
        setIsUploading(true);
        setUploadProgress(null);
        const dataUrl = await readFileAsDataUrl(attachmentFile);
        attachmentPayload = {
          data: dataUrl,
          type: attachmentFile.type,
          name: attachmentFile.name,
          size: attachmentFile.size,
        };
      }

      let responseMessage: Message | null = null;
      try {
        responseMessage = await sendMessageWithSocket({
          receiverId: otherUserId,
          message: text,
          tempId,
          attachment: attachmentPayload,
          replyTo
        });
      } catch (socketError) {
        responseMessage = null;
      }

      if (!responseMessage) {
        const { data } = await api.sendMessage(
          otherUserId,
          {
            message: text,
            tempId,
            attachment: attachmentPayload,
            replyTo,
          } as any,
          attachmentPayload
            ? {
              onUploadProgress: (event) => {
                if (!event.total) return;
                setUploadProgress(Math.round((event.loaded / event.total) * 100));
              },
            }
            : undefined
        );
        responseMessage = data;
      }

      setMessages(prev => mergeResolvedMessage(prev, { ...responseMessage, status: undefined }));
      updateCachedMessages(otherUserId, cachedMessages => mergeResolvedMessage(cachedMessages, { ...responseMessage, status: undefined }));

      if (activeConversation.id.startsWith('temp-')) {
        const newConversations = await fetchConversations();
        const newConvo = newConversations.find((c: Conversation) => c.participants.some(p => p.id === otherUserId));
        if (newConvo) {
          setActiveConversation({ ...newConvo, messages: messages });
        }
      }
    } catch (error: any) {
      console.error("Failed to send message", error);
      const serverMsg = error.response?.data?.message || error.message || "Connection failed";
      toast.error(`Send Failed: ${serverMsg}`);
      setMessages(prev => prev.map(m => (m.id === tempMessage.id ? { ...m, status: 'failed' } : m)));
      updateCachedMessages(otherUserId, cachedMessages => cachedMessages.map(message => (message.id === tempMessage.id ? { ...message, status: 'failed' } : message)));
    } finally {
      setIsSending(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) {
        const cachedEntry = messageCache.current.get(otherUserId);
        if (cachedEntry) {
          messageCache.current.set(otherUserId, { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) });
        }
      }
    }
    try {
      await api.deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handleDeleteMessageForMe = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) {
        const cachedEntry = messageCache.current.get(otherUserId);
        if (cachedEntry) {
          messageCache.current.set(otherUserId, { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) });
        }
      }
    }
    try {
      await api.deleteMessageForMe(messageId);
    } catch (error) {
      console.error("Failed to delete message for me", error);
    }
  };

  const handleClearConversation = async (otherUserId: string) => {
    if (activeConversation && activeConversation.participants.some(p => p.id === otherUserId)) {
      setMessages([]);
    }
    messageCache.current.set(otherUserId, { messages: [], hasMore: false });
    setConversations(prev => prev.map(conv => {
      const convoOtherId = conv.participants.find(p => p.id !== currentUser.id)?.id;
      if (convoOtherId !== otherUserId) return conv;
      return { ...conv, lastMessage: '', timestamp: new Date().toISOString() };
    }));
    try {
      await api.clearConversation(otherUserId);
    } catch (error) {
      console.error("Failed to clear conversation", error);
    }
  };

  const handleToggleAutoDelete = (otherUserId: string) => {
    setAutoDeleteMap(prev => ({ ...prev, [otherUserId]: !prev[otherUserId] }));
  };

  const activeOtherUserId = activeConversation?.participants.find(p => p.id !== currentUser.id)?.id || null;
  const autoDeleteEnabled = activeOtherUserId ? !!autoDeleteMap[activeOtherUserId] : false;
  const filteredMessages = useMemo(() => {
    if (!autoDeleteEnabled) return messages;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return messages.filter(message => new Date(message.timestamp).getTime() >= cutoff);
  }, [autoDeleteEnabled, messages]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background md:flex-row">

      {/* 
        CONVERSATION LIST (SIDEBAR)
        Mobile: Full width, hidden when chat is open
        Desktop: Fixed width 
      */}
      <div
        className={`min-h-0 w-full flex-1 flex-col bg-background ${isMessageAreaVisible ? 'hidden md:flex md:w-[320px] md:flex-shrink-0 lg:w-[380px]' : 'flex'} md:border-r md:border-border`}
      >
        <ConversationList
          conversations={conversations}
          isLoading={isLoadingConversations}
          currentUser={currentUser}
          chukUser={chukUser}
          userMap={userMap}
          activeConversationId={activeConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewMessage={() => setNewMessageModalOpen(true)}
          unreadCounts={unreadCounts.messages}
          onClearConversation={handleClearConversation}
          onToggleBlock={onToggleBlock}
          onToggleAutoDelete={handleToggleAutoDelete}
          autoDeleteMap={autoDeleteMap}
        />
      </div>

      {/* 
        MESSAGE AREA (MAIN CONTENT)
        Mobile: Fixed Overlay on top of everything (z-[60]), controlled by isMessageAreaVisible
        Desktop: Flex-1, static
      */}
      <div
        className={`min-h-0 flex-1 flex-col bg-background ${isMessageAreaVisible ? 'flex' : 'hidden md:flex'}`}
      >
        {activeConversation ? (
          <MessageArea
            key={activeConversation.id}
            conversation={activeConversation}
            messages={filteredMessages}
            isLoading={isLoadingMessages}
            currentUser={currentUser}
            userMap={userMap}
            isSending={isSending}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            hasMore={hasMoreMessages}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMoreMessages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeleteMessageForMe={handleDeleteMessageForMe}
            onBack={handleBackToList}
            onViewProfile={onViewProfile}
          />
        ) : isInitializing ? (
          <ChatShell
            header={(
              <div className="flex items-center border-b border-border bg-surface/95 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),0.75rem)] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-border opacity-50 animate-pulse mr-3" />
                <div className="h-4 w-32 bg-border opacity-50 rounded animate-pulse" />
              </div>
            )}
            composer={(
              <div className="px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border z-20">
                <div className="w-full h-11 bg-surface border border-border rounded-full opacity-50" />
              </div>
            )}
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <img src="/busstop.gif" width={80} alt="Loading..." className="mb-4" />
                <p className="text-secondary text-lg">Loading conversation...</p>
              </div>
            </div>
          </ChatShell>
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
