import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation, User, Message, Post } from '../../types';
import ConversationList from './ConversationList';
import { MessageArea } from './MessageArea';
import NewMessageModal from './NewMessageModal';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from '../common/Toast';
import { safeSetItem } from '../../utils/safeLocalStorage';
import { readCachedResource, writeCachedResource } from '../../utils/cache';

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

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const conversationCacheKey = 'tribe_cache_conversations';
const dmCacheKey = (userId: string) => `tribe_cache_dm_${userId}`;

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers, chukUser, initialTargetUser, onViewProfile, onConversationStateChange, onToggleBlock }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => readCachedResource<Conversation[]>(conversationCacheKey)?.data || []);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [autoDeleteMap, setAutoDeleteMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('dmAutoDelete') || '{}');
    } catch {
      return {};
    }
  });
  const [isLoadingConversations, setIsLoadingConversations] = useState(conversations.length === 0);
  const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);
  const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!initialTargetUser);
  const messageCache = useRef<Map<string, { messages: Message[]; hasMore: boolean; oldestTimestamp?: string }>>(new Map());
  const { socket, clearUnreadMessages, unreadCounts, setActiveChatPartnerId } = useSocket();

  useEffect(() => () => setActiveChatPartnerId(null), [setActiveChatPartnerId]);
  useEffect(() => { window.localStorage.setItem('dmAutoDelete', JSON.stringify(autoDeleteMap)); }, [autoDeleteMap]);
  useEffect(() => { onConversationStateChange?.(!!activeConversation); }, [activeConversation, onConversationStateChange]);

  const userMap = useMemo(() => {
    const map = new Map(allUsers.map(user => [user.id, user]));
    map.set(chukUser.id, chukUser);
    return map;
  }, [allUsers, chukUser]);

  const syncConversationCache = useCallback((nextConversations: Conversation[]) => {
    setConversations(nextConversations);
    writeCachedResource(conversationCacheKey, nextConversations);
    safeSetItem('tribe_storage_conversations', JSON.stringify(nextConversations));
  }, []);

  const setConversationMessages = useCallback((otherUserId: string, next: { messages: Message[]; hasMore: boolean; oldestTimestamp?: string }) => {
    messageCache.current.set(otherUserId, next);
    writeCachedResource(dmCacheKey(otherUserId), next);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.fetchConversations();
      syncConversationCache(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch conversations', error);
      return conversations;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [conversations, syncConversationCache]);

  useEffect(() => { void fetchConversations(); }, [fetchConversations]);

  const hydrateConversation = useCallback(async (conv: Conversation, options?: { skipRefresh?: boolean }) => {
    setActiveConversation(conv);
    setMessageAreaVisible(true);
    const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;

    setActiveChatPartnerId(otherUserId);
    clearUnreadMessages(otherUserId);
    if (socket?.connected) socket.emit('joinRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);

    if (otherUserId === chukUser.id) {
      setMessages([{ id: 'chuk-intro', senderId: chukUser.id, receiverId: currentUser.id, text: `Psy... Hi ${currentUser.name.split(' ')[0]}! I'm Psyduck! What's on your mind? ...Psy? 🦆`, timestamp: new Date().toISOString() }]);
      setHasMoreMessages(false);
      setIsLoadingMessages(false);
      setIsInitializing(false);
      return;
    }

    const memoryCached = messageCache.current.get(otherUserId);
    const storageCached = readCachedResource<{ messages: Message[]; hasMore: boolean; oldestTimestamp?: string }>(dmCacheKey(otherUserId))?.data;
    const cachedEntry = memoryCached || storageCached;
    if (cachedEntry) {
      setConversationMessages(otherUserId, cachedEntry);
      setMessages(cachedEntry.messages);
      setHasMoreMessages(cachedEntry.hasMore);
      setIsLoadingMessages(false);
    } else {
      setMessages([]);
      setHasMoreMessages(false);
      setIsLoadingMessages(true);
    }

    if (options?.skipRefresh) return;

    try {
      const { data } = await api.fetchMessages(otherUserId, { limit: 50 });
      const nextEntry = { messages: data, hasMore: data.length === 50, oldestTimestamp: data[0]?.timestamp };
      setConversationMessages(otherUserId, nextEntry);
      setMessages(prev => prev.length > 0 && data.length === 0 ? prev : data);
      setHasMoreMessages(nextEntry.hasMore);
    } catch (error) {
      console.error('Failed to fetch messages', error);
      if (!cachedEntry) setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      setIsInitializing(false);
    }
  }, [currentUser.id, currentUser.name, chukUser.id, clearUnreadMessages, setActiveChatPartnerId, setConversationMessages, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: Message) => {
      if (message.senderId === currentUser.id && message.status === 'sending') return;
      const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
      const existing = messageCache.current.get(otherUserId) || { messages: [], hasMore: false };
      const merged = [...existing.messages.filter(m => m.id !== message.id && m.id !== `temp-${message.clientTempId || ''}`), message]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setConversationMessages(otherUserId, { ...existing, messages: merged });

      if (activeConversation?.participants.some(p => p.id === otherUserId)) {
        setMessages(merged);
      }

      syncConversationCache([
        {
          id: `conv-${otherUserId}`,
          participants: [{ id: currentUser.id }, { id: otherUserId }],
          messages: [],
          lastMessage: message.text || 'Attachment',
          timestamp: message.timestamp,
        },
        ...conversations.filter(c => !c.participants.some(p => p.id === otherUserId)),
      ]);
    };

    const handleMessageDeleted = ({ messageId, senderId, receiverId }: { messageId: string; senderId: string; receiverId: string }) => {
      const otherUserId = senderId === currentUser.id ? receiverId : senderId;
      const cachedEntry = messageCache.current.get(otherUserId);
      if (!cachedEntry) return;
      const nextEntry = { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) };
      setConversationMessages(otherUserId, nextEntry);
      if (activeConversation?.participants.some(p => p.id === otherUserId)) setMessages(nextEntry.messages);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, activeConversation, currentUser.id, conversations, setConversationMessages, syncConversationCache]);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    await hydrateConversation(conv);
  }, [hydrateConversation]);

  const handleStartNewConversation = useCallback((targetUser: User) => {
    const existingConvo = targetUser.id === chukUser.id
      ? { id: chukUser.id, participants: [{ id: currentUser.id }, { id: chukUser.id }], lastMessage: 'AI Assistant', timestamp: new Date().toISOString(), messages: [] }
      : conversations.find(c => c.participants.some(p => p.id === targetUser.id)) || { id: `temp-${targetUser.id}`, participants: [{ id: currentUser.id }, { id: targetUser.id }], messages: [], lastMessage: `Start a conversation with ${targetUser.name}`, timestamp: new Date().toISOString() };
    void hydrateConversation(existingConvo, { skipRefresh: existingConvo.id.startsWith('temp-') && targetUser.id !== chukUser.id });
  }, [chukUser.id, conversations, currentUser.id, hydrateConversation]);

  useEffect(() => {
    if (initialTargetUser && !activeConversation) {
      setIsInitializing(true);
      handleStartNewConversation(initialTargetUser);
    }
  }, [initialTargetUser, activeConversation, handleStartNewConversation]);

  const handleBackToList = () => {
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) socket?.emit('leaveRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    }
    setActiveChatPartnerId(null);
    setActiveConversation(null);
    setMessageAreaVisible(false);
  };

  const handleLoadMoreMessages = useCallback(async () => {
    if (!activeConversation || isLoadingMore || !hasMoreMessages) return;
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    const cachedEntry = otherUserId ? messageCache.current.get(otherUserId) : null;
    if (!otherUserId || !cachedEntry?.oldestTimestamp) return;

    setIsLoadingMore(true);
    try {
      const { data } = await api.fetchMessages(otherUserId, { limit: 50, before: cachedEntry.oldestTimestamp });
      const nextEntry = {
        messages: [...data, ...cachedEntry.messages],
        hasMore: data.length === 50,
        oldestTimestamp: data[0]?.timestamp || cachedEntry.oldestTimestamp,
      };
      setConversationMessages(otherUserId, nextEntry);
      setMessages(nextEntry.messages);
      setHasMoreMessages(nextEntry.hasMore);
    } catch (error) {
      console.error('Failed to load older messages', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeConversation, currentUser.id, hasMoreMessages, isLoadingMore, setConversationMessages]);

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const sendMessageWithSocket = useCallback(async (payload: { receiverId: string; message?: string; tempId?: string; attachment?: { data: string; type: string; name?: string; size?: number } | null; replyTo?: string | null; }) => {
    if (!socket?.connected) return null;
    return new Promise<Message>((resolve, reject) => {
      socket.timeout(15000).emit('sendMessage', payload, (err: Error | null, response: { ok: boolean; message?: Message; error?: string }) => {
        if (err || !response?.ok || !response.message) return reject(new Error(response?.error || 'Socket send failed'));
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
    if (attachmentFile && attachmentFile.size > MAX_ATTACHMENT_BYTES) return toast.error('Attachment must be 20MB or less.');

    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;
    if (otherUserId === chukUser.id && attachmentFile) return toast.error('Attachments are not supported in Psyduck chat.');

    setIsSending(true);
    const tempId = `${Date.now()}`;
    const tempMessage: Message = {
      id: `temp-${tempId}`,
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

    const currentEntry = messageCache.current.get(otherUserId) || { messages: [], hasMore: false };
    const optimisticEntry = { ...currentEntry, messages: [...currentEntry.messages, tempMessage] };
    setConversationMessages(otherUserId, optimisticEntry);
    setMessages(optimisticEntry.messages);

    try {
      if (otherUserId === chukUser.id) {
        const { data } = await api.generateAiChat({ prompt: text });
        setMessages(prev => [...prev, { id: `chuk-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: data.text, timestamp: new Date().toISOString() }]);
        return;
      }

      let attachmentPayload = null;
      if (attachmentFile) {
        setIsUploading(true);
        const dataUrl = await readFileAsDataUrl(attachmentFile);
        attachmentPayload = { data: dataUrl, type: attachmentFile.type, name: attachmentFile.name, size: attachmentFile.size };
      }

      let responseMessage: Message | null = null;
      try {
        responseMessage = await sendMessageWithSocket({ receiverId: otherUserId, message: text, tempId, attachment: attachmentPayload, replyTo });
      } catch {
        responseMessage = null;
      }
      if (!responseMessage) {
        const { data } = await api.sendMessage(otherUserId, { message: text, tempId, attachment: attachmentPayload, replyTo } as any, attachmentPayload ? { onUploadProgress: (event) => event.total && setUploadProgress(Math.round((event.loaded / event.total) * 100)) } : undefined);
        responseMessage = data;
      }

      const confirmed = (messageCache.current.get(otherUserId)?.messages || []).map(msg => msg.id === tempMessage.id ? { ...responseMessage!, status: undefined } : msg);
      setConversationMessages(otherUserId, { ...(messageCache.current.get(otherUserId) || optimisticEntry), messages: confirmed });
      setMessages(confirmed);
      const nextConversations = await fetchConversations();
      const latest = nextConversations.find((c: Conversation) => c.participants.some(p => p.id === otherUserId));
      if (latest) setActiveConversation(latest);
    } catch (error: any) {
      console.error('Failed to send message', error);
      toast.error(`Send Failed: ${error.response?.data?.message || error.message || 'Connection failed'}`);
      const failed = (messageCache.current.get(otherUserId)?.messages || optimisticEntry.messages).map(msg => msg.id === tempMessage.id ? { ...msg, status: 'failed' as const } : msg);
      setConversationMessages(otherUserId, { ...(messageCache.current.get(otherUserId) || optimisticEntry), messages: failed });
      setMessages(failed);
    } finally {
      setIsSending(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const otherUserId = activeConversation?.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;
    const updated = (messageCache.current.get(otherUserId)?.messages || []).filter(m => m.id !== messageId);
    setConversationMessages(otherUserId, { ...(messageCache.current.get(otherUserId) || { hasMore: false }), messages: updated });
    setMessages(updated);
    try { await api.deleteMessage(messageId); } catch (error) { console.error('Failed to delete message', error); }
  };

  const handleDeleteMessageForMe = async (messageId: string) => {
    const otherUserId = activeConversation?.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;
    const updated = (messageCache.current.get(otherUserId)?.messages || []).filter(m => m.id !== messageId);
    setConversationMessages(otherUserId, { ...(messageCache.current.get(otherUserId) || { hasMore: false }), messages: updated });
    setMessages(updated);
    try { await api.deleteMessageForMe(messageId); } catch (error) { console.error('Failed to delete message for me', error); }
  };

  const handleClearConversation = async (otherUserId: string) => {
    setConversationMessages(otherUserId, { messages: [], hasMore: false });
    if (activeConversation?.participants.some(p => p.id === otherUserId)) setMessages([]);
    try { await api.clearConversation(otherUserId); } catch (error) { console.error('Failed to clear conversation', error); }
  };

  const handleToggleAutoDelete = (otherUserId: string) => setAutoDeleteMap(prev => ({ ...prev, [otherUserId]: !prev[otherUserId] }));

  const activeOtherUserId = activeConversation?.participants.find(p => p.id !== currentUser.id)?.id || null;
  const filteredMessages = useMemo(() => {
    if (!activeOtherUserId || !autoDeleteMap[activeOtherUserId]) return messages;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return messages.filter(message => new Date(message.timestamp).getTime() >= cutoff);
  }, [activeOtherUserId, autoDeleteMap, messages]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-none bg-surface md:rounded-[28px] md:border md:border-border md:shadow-lg">
      <div className={`h-full min-h-0 w-full flex-shrink-0 bg-surface md:flex md:w-[340px] lg:w-[380px] ${isMessageAreaVisible ? 'hidden md:flex' : 'flex'}`}>
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

      <div className={`min-h-0 flex-1 bg-background ${isMessageAreaVisible ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation ? (
          <MessageArea
            conversation={activeConversation}
            messages={filteredMessages}
            isLoading={isLoadingMessages || isInitializing}
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
        ) : (
          <div className="hidden h-full flex-1 items-center justify-center md:flex">
            <div className="max-w-sm text-center text-secondary">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-sm">💬</div>
              <h2 className="mb-2 text-xl font-bold text-primary">Choose a conversation</h2>
              <p>Open a recent chat or start a new message. Cached conversations appear instantly and refresh in the background.</p>
            </div>
          </div>
        )}
      </div>

      {isNewMessageModalOpen && (
        <NewMessageModal
          currentUser={currentUser}
          allUsers={allUsers.filter(user => user.id !== currentUser.id)}
          onClose={() => setNewMessageModalOpen(false)}
          onSelectUser={(user) => {
            setNewMessageModalOpen(false);
            handleStartNewConversation(user);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
