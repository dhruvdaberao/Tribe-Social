import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { useGlobalContent } from '../../contexts/GlobalContentContext';
import TribeMessageArea from '../chat/TribeMessageArea';
import ChatShell from '../chat/ChatShell'; // Added import
import TribeMembersModal from './TribeMembersModal';
import EditTribeModal from './EditTribeModal';
import { Users, ArrowLeft, Edit2, LogIn, LogOut, Flame, X, Lock } from 'lucide-react';
import { toast } from '../common/Toast';
import ConfirmationModal from '../common/ConfirmationModal';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';

/* ───────────── STYLES ───────────── */
const PageContainer = styled.div`
  height: var(--app-height);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  min-height: 0;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 12px 16px;
  background: ${({ theme }) => theme.cardBackground}F2; /* Opacity for blur effect */
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%; /* Force full width */
  
  /* Mobile: Header stays at top naturally in flex col */
  z-index: 100;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  
  /* Safe area support for notched devices */
  padding-top: max(12px, env(safe-area-inset-top));
  
  @media (max-width: 640px) {
    padding: 12px;
    padding-top: max(12px, env(safe-area-inset-top));
    gap: 10px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-left: -8px;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.hover};
  }
`;

const Avatar = styled.div<{ $src?: string | null }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme, $src }) => $src ? `url(${$src}) center/cover` : theme.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const HeaderInfo = styled.div`
  flex: 1;
  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }
  p {
    margin: 2px 0 0;
    font-size: 0.8rem;
    opacity: 0.7;
    cursor: pointer;
  }
`;

const HeaderLoader = styled.div`
  height: 6px;
  width: 64px;
  border-radius: 999px;
  background: ${({ theme }) => theme.border};
  opacity: 0.7;
  margin-top: 6px;
  animation: pulse 1.6s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 6px;
`;

const MemberCountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
  cursor: pointer;
  
  &:hover { opacity: 1; }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: ${({ theme }) => theme.textSecondary};
`;

const CampfireOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
`;

const CampfireModal = styled.div`
  width: min(380px, 100%);
  max-height: 70vh;
  background: ${({ theme }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
`;

const CampfireHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
  }
`;

const CampfireClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  padding: 4px;
`;

const CampfireBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.95rem;
`;

/* ───────────── COMPONENT ───────────── */
interface Props {
  currentUser: User | null;
  tribeId?: string; // 🔥 Added prop to receive ID from parent (App.tsx)
}

const TribeDetailPage: React.FC<Props> = ({ currentUser, tribeId: propTribeId }) => {
  const params = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
  useVisualViewportHeight();

  const id = propTribeId || params.tribeId;

  const { socket, joinRoom, leaveRoom, clearUnreadTribe, onlineUsers } = useSocket();
  const { tribes: allTribes } = useGlobalContent();

  // Optimistic init from navigation state
  const cachedTribe = useMemo(() => allTribes.find(t => t.id === id), [allTribes, id]);

  const [tribe, setTribe] = useState<Tribe | null>(() => cachedTribe || null);

  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [areMessagesLoading, setAreMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isCampfireOpen, setIsCampfireOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCache = useRef<Map<string, { messages: TribeMessage[]; hasMore: boolean; oldestTimestamp?: string }>>(new Map());

  const [isLoading, setIsLoading] = useState(!cachedTribe);

  /* ───────────── LOAD TRIBE FIRST ───────────── */
  useEffect(() => {
    // Handle missing ID
    if (!id) {
      console.error('Tribe ID is undefined');
      setError('Invalid tribe link');
      setIsLoading(false);
      // Give user a chance to read the error before redirecting
      const timer = setTimeout(() => navigate('/tribes'), 3000);
      return () => clearTimeout(timer);
    }

    const loadTribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 🔥 CRITICAL: Fetch tribe FIRST (don't block on users)
        const tribeRes = await api.fetchTribe(id);
        setTribe(tribeRes.data);

        // Then fetch users in background (non-blocking)
        api.fetchUsers()
          .then(({ data }) => setAllUsers(data))
          .catch(err => console.error('Failed to load users:', err));

      } catch (err: any) {
        console.error('Failed to load tribe:', err);

        if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
          // Likely a CORS or Network issue
          setError('Connection failed. Please check your internet or try again.');
          // Do NOT redirect automatically for network errors
        } else if (err.response?.status === 404) {
          setError('Tribe not found');
          setTimeout(() => navigate('/tribes'), 2000);
        } else if (err.response?.status === 401) {
          setError('You are not authorized to view this tribe.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        // 🔥 CRITICAL: Always clear loading state
        setIsLoading(false);
      }
    };

    loadTribe();
  }, [id, navigate]);

  const isMember =
    !!tribe &&
    !!currentUser &&
    (tribe.owner === currentUser.id ||
      tribe.members.includes(currentUser.id));

  const userMap = useMemo(
    () => new Map(allUsers.map(u => [u.id, u])),
    [allUsers]
  );

  const sortMessages = useCallback((items: TribeMessage[]) => {
    return [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  const mergeResolvedMessage = useCallback((existing: TribeMessage[], incoming: TribeMessage) => {
    const hydratedMessage = { ...incoming };
    if (!hydratedMessage.sender || typeof hydratedMessage.sender === 'string' || !hydratedMessage.sender.name) {
      const foundUser = userMap.get(incoming.senderId);
      if (foundUser) {
        hydratedMessage.sender = foundUser;
      }
    }

    const tempId = hydratedMessage.tempId ?? hydratedMessage.clientTempId;
    const next = existing.filter(message => {
      if (message.id === hydratedMessage.id) return false;
      if (!tempId) return true;
      return message.id !== `temp-${tempId}` && message.clientTempId !== tempId;
    });

    return sortMessages([...next, { ...hydratedMessage, status: undefined }]);
  }, [sortMessages, userMap]);

  const updateCachedMessages = useCallback((updater: (existing: TribeMessage[]) => TribeMessage[]) => {
    if (!id) return;
    const cachedEntry = messageCache.current.get(id);
    const nextMessages = updater(cachedEntry?.messages || []);

    messageCache.current.set(id, {
      messages: nextMessages,
      hasMore: cachedEntry?.hasMore ?? false,
      oldestTimestamp: cachedEntry?.oldestTimestamp,
    });
  }, [id]);

  /* ───────────── DELETE HANDLER ───────────── */
  const handleDeleteTribe = async (tribeId: string) => {
    try {
      await api.deleteTribe(tribeId);
      toast.success('Tribe deleted successfully');
      navigate('/tribes');
    } catch (err) {
      console.error('Failed to delete tribe:', err);
      toast.error('Failed to delete tribe');
    }
  };

  /* ───────────── LOAD MESSAGES ───────────── */
  useEffect(() => {
    if (!id || !isMember) return;

    const cachedEntry = messageCache.current.get(id);
    if (cachedEntry?.messages?.length) {
      setMessages(cachedEntry.messages);
      setHasMoreMessages(cachedEntry.hasMore);
      clearUnreadTribe(id);
      return;
    }

    const loadMessages = async () => {
      try {
        setAreMessagesLoading(true);
        const res = await api.fetchTribeMessages(id, { limit: 50 });
        const hasMore = res.data.length === 50;
        const oldestTimestamp = res.data[0]?.timestamp;
        messageCache.current.set(id, { messages: res.data, hasMore, oldestTimestamp });
        setMessages(res.data);
        setHasMoreMessages(hasMore);
        clearUnreadTribe(id);
      } finally {
        setAreMessagesLoading(false);
      }
    };

    loadMessages();
  }, [id, isMember, clearUnreadTribe]);

  const handleLoadMoreMessages = async () => {
    if (!id || isLoadingMore || !hasMoreMessages) return;
    const cachedEntry = messageCache.current.get(id);
    const before = cachedEntry?.oldestTimestamp;
    if (!before) return;

    setIsLoadingMore(true);
    try {
      const res = await api.fetchTribeMessages(id, { limit: 50, before });
      const nextMessages = [...res.data, ...(cachedEntry?.messages || [])];
      const nextHasMore = res.data.length === 50;
      const oldestTimestamp = res.data[0]?.timestamp || cachedEntry?.oldestTimestamp;
      messageCache.current.set(id, { messages: nextMessages, hasMore: nextHasMore, oldestTimestamp });
      setMessages(nextMessages);
      setHasMoreMessages(nextHasMore);
    } finally {
      setIsLoadingMore(false);
    }
  };

  /* ───────────── JOIN SOCKET ROOM (CRITICAL) ───────────── */
  useEffect(() => {
    // Only join if we have a valid ID, are a member, AND socket is connected
    if (!id || !isMember || !socket || !socket.connected) {
      return;
    }

    const room = id;
    joinRoom(room);

    // Re-join on reconnect (SocketContext mostly handles this, but explicit is safe)
    const handleReconnect = () => {
      joinRoom(room);
    };

    socket.on('connect', handleReconnect);

    return () => {
      leaveRoom(room);
      socket.off('connect', handleReconnect);
    };
  }, [id, isMember, joinRoom, leaveRoom, socket]); // 🔥 Added socket dependency

  /* ───────────── REAL-TIME RECEIVE ───────────── */
  /* ───────────── REAL-TIME RECEIVE ───────────── */
  useEffect(() => {
    if (!socket || !id || !isMember) {
      return;
    }

    const handleIncoming = (message: TribeMessage) => {
      if (message.tribeId !== id) return;

      setMessages(prev => mergeResolvedMessage(prev, message));
      updateCachedMessages(cachedMessages => mergeResolvedMessage(cachedMessages, message));

      // Clear unread count immediately since we are viewing it
      if (document.visibilityState === 'visible') {
        clearUnreadTribe(id);
      }
    };

    socket.on('newTribeMessage', handleIncoming);

    return () => {
      socket.off('newTribeMessage', handleIncoming);
    };
  }, [socket, id, isMember, clearUnreadTribe, mergeResolvedMessage, updateCachedMessages]);

  /* ───────────── REMOVED LEGACY SCROLL ───────────── */
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  /* ───────────── SEND MESSAGE ───────────── */
  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sendTribeMessageWithSocket = async (payload: {
    tribeId: string;
    text?: string;
    tempId?: string;
    attachment?: { data: string; type: string; name?: string; size?: number } | null;
    replyTo?: string | null;
  }) => {
    if (!socket || !socket.connected) return null;
    return new Promise<TribeMessage>((resolve, reject) => {
      socket.timeout(15000).emit('sendTribeMessage', payload, (err: Error | null, response: { ok: boolean; message?: TribeMessage; error?: string }) => {
        if (err || !response?.ok || !response.message) {
          reject(new Error(response?.error || 'Socket send failed'));
          return;
        }
        resolve(response.message);
      });
    });
  };

  const handleSend = async (payload: { text?: string; attachment?: File; replyTo?: string | null }) => {
    if (!id || !currentUser || isSending || isUploading) return;
    const text = payload.text?.trim() || '';
    const attachmentFile = payload.attachment;
    const replyTo = payload.replyTo || null;
    if (!text && !attachmentFile) return;
    if (attachmentFile && attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      toast.error('Attachment must be 20MB or less.');
      return;
    }

    const tempId = `${Date.now()}`;
    const optimistic: TribeMessage = {
      id: `temp-${tempId}`,
      tempId,
      tribeId: id,
      sender: currentUser,
      senderId: currentUser.id,
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

    setMessages(prev => sortMessages([...prev, optimistic]));
    updateCachedMessages(cachedMessages => sortMessages([...cachedMessages, optimistic]));
    setIsSending(true);

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

      let responseMessage: TribeMessage | null = null;

      try {
        responseMessage = await sendTribeMessageWithSocket({
          tribeId: id,
          text,
          tempId,
          attachment: attachmentPayload,
          replyTo
        });
      } catch (socketError) {
        responseMessage = null;
      }

      if (!responseMessage) {
        const { data } = await api.sendTribeMessage(
          id,
          { text, tempId, attachment: attachmentPayload, replyTo } as any,
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
      updateCachedMessages(cachedMessages => mergeResolvedMessage(cachedMessages, { ...responseMessage, status: undefined }));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? { ...m, status: 'failed' } : m)));
      updateCachedMessages(cachedMessages => cachedMessages.map(message => (message.id === optimistic.id ? { ...message, status: 'failed' } : message)));
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!id) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    const cachedEntry = messageCache.current.get(id);
    if (cachedEntry) {
      messageCache.current.set(id, { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) });
    }
    try {
      await api.deleteTribeMessage(id, messageId);
    } catch (error) {
      console.error('Failed to delete tribe message', error);
      toast.error('Failed to delete message.');
    }
  };

  const handleDeleteMessageForMe = async (messageId: string) => {
    if (!id) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    const cachedEntry = messageCache.current.get(id);
    if (cachedEntry) {
      messageCache.current.set(id, { ...cachedEntry, messages: cachedEntry.messages.filter(m => m.id !== messageId) });
    }
    try {
      await api.deleteTribeMessageForMe(id, messageId);
    } catch (error) {
      console.error('Failed to delete tribe message for me', error);
      toast.error('Failed to delete message.');
    }
  };

  /* ───────────── JOIN / LEAVE ───────────── */
  const [leavePrompt, setLeavePrompt] = useState('');

  const performJoinToggle = async () => {
    if (!id || !tribe || !currentUser) return;

    const optimistic = {
      ...tribe,
      members: tribe.members.includes(currentUser.id)
        ? tribe.members.filter(m => m !== currentUser.id)
        : [...tribe.members, currentUser.id]
    };

    setTribe(optimistic);

    try {
      const { data } = await api.joinTribe(id);
      setTribe(data);
    } catch {
      setTribe(tribe);
    }
  };


  const handleKickMember = async (userId: string) => {
    if (!id || !tribe) return;
    const previousMembers = tribe.members;
    const nextMembers = tribe.members.filter((memberId) => memberId !== userId);
    setTribe({ ...tribe, members: nextMembers });
    try {
      const { data } = await api.kickTribeMember(id, userId);
      setTribe(data);
      toast.success('Member removed.');
    } catch (error: any) {
      setTribe({ ...tribe, members: previousMembers });
      toast.error(error?.response?.data?.message || 'Failed to kick member.');
    }
  };

  const handleJoinToggle = async () => {
    if (!id || !tribe || !currentUser) return;

    const isLeaving = tribe.members.includes(currentUser.id);
    if (isLeaving) {
      if (tribe.owner === currentUser.id && tribe.members.length > 1) {
        toast.error('You must transfer the Chief role before leaving.');
        setIsEditOpen(true);
        return;
      }

      const prompt = tribe.members.length <= 1
        ? 'You are the last member. Leaving will close this tribe. Continue?'
        : `Are you sure you want to leave @${tribe.name}?`;
      setLeavePrompt(prompt);
      setIsLeaveConfirmOpen(true);
      return;
    }

    await performJoinToggle();
  };

  /* ───────────── SHOW ERROR IF EXISTS ───────────── */
  if (error) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate('/tribes')}>
            <ArrowLeft size={20} />
          </BackButton>
          <h3>Error</h3>
        </Header>
        <div style={{ padding: 40 }}>{error}</div>
      </PageContainer>
    );
  }

  /* ───────────── RENDER HELPERS ───────────── */
  const renderHeader = () => (
    <Header>
      <BackButton onClick={() => navigate('/tribes')}>
        <BackIcon />
      </BackButton>

      <Avatar $src={tribe?.avatarUrl}>
        {!tribe?.avatarUrl && <Users size={20} color="#D6B9A0" />}
      </Avatar>

      <HeaderInfo>
        <h2>{tribe?.name || 'Loading...'}</h2>
        {isLoading && !tribe && <HeaderLoader />}
        <MemberCountBadge onClick={() => setIsMembersOpen(true)}>
          <span>{tribe?.members?.length || 0}/{tribe?.memberLimit || 50} members</span>
        </MemberCountBadge>
      </HeaderInfo>

      <HeaderActions>
        <ActionButton onClick={() => setIsCampfireOpen(true)} aria-label="Open Campfire">
          <Flame size={18} />
        </ActionButton>
        {currentUser && tribe?.owner === currentUser.id && (
          <ActionButton onClick={() => setIsEditOpen(true)}>
            <Edit2 size={18} />
          </ActionButton>
        )}

        {currentUser && tribe && (
          <ActionButton onClick={handleJoinToggle}>
            {isMember ? <LogOut size={18} /> : <LogIn size={18} />}
          </ActionButton>
        )}
      </HeaderActions>
    </Header>
  );

  /* ───────────── ALWAYS SHOW CHAT UI (NO LOADING SCREEN) ───────────── */
  return (
    <>
      {isLoading && !tribe ? (
        /* LOADING STATE */
        <ChatShell
          header={
            <Header>
              <BackButton onClick={() => navigate('/tribes')}>
                <BackIcon />
              </BackButton>
              <div className="w-10 h-10 rounded-full bg-border/50 animate-pulse" />
              <HeaderInfo>
                <div className="h-5 w-32 bg-border/50 rounded animate-pulse" />
                <div className="h-3 w-20 bg-border/50 rounded animate-pulse mt-2" />
              </HeaderInfo>
            </Header>
          }
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-secondary">Loading tribe...</p>
            </div>
          </div>
        </ChatShell>
      ) : isMember && tribe ? (
        /* CHAT STATE */
        <TribeMessageArea
          tribe={tribe}
          messages={messages}
          isLoading={areMessagesLoading}
          currentUser={currentUser!}
          isSending={isSending}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          hasMore={hasMoreMessages}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMoreMessages}
          onSendMessage={handleSend}
          onDeleteMessage={handleDeleteMessage}
          onDeleteMessageForMe={handleDeleteMessageForMe}
          header={renderHeader()}
        />
      ) : (
        /* JOIN PROMPT */
        <ChatShell header={renderHeader()}>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center min-h-0 overflow-y-auto">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-2">
              <Users size={48} className="text-secondary opacity-50" />
            </div>
            <h2 className="text-xl font-bold inline-flex items-center gap-2">
              {tribe?.isPrivate && <Lock size={18} className="text-accent" />}
              Join {tribe?.name || 'Tribe'}
            </h2>
            <p className="text-secondary max-w-sm">
              {tribe?.isPrivate
                ? 'This is a private tribe. Send a request and the Chief will review it.'
                : 'Join this tribe to start chatting with members and share your thoughts.'}
            </p>
            {tribe?.vibe && tribe.vibe !== 'General' && (
              <span style={{ fontSize: '0.8rem', padding: '3px 12px', borderRadius: 20, background: 'rgba(214, 185, 160, 0.15)', color: '#D6B9A0', fontWeight: 600 }}>{tribe.vibe}</span>
            )}
            {(() => {
              const hasPendingRequest = tribe?.isPrivate && currentUser && tribe.joinRequests?.includes(currentUser.id);
              return (
                <button
                  onClick={handleJoinToggle}
                  disabled={!!hasPendingRequest}
                  className="mt-4 px-8 py-3 bg-accent text-accent-text font-bold rounded-full hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {hasPendingRequest ? 'Requested (Pending)' : tribe?.isPrivate ? 'Request to Join' : 'Join Tribe'}
                </button>
              );
            })()}
          </div>
        </ChatShell>
      )}

      {isEditOpen && tribe && (
        <EditTribeModal
          tribe={tribe}
          onClose={() => setIsEditOpen(false)}
          onSuccess={t => {
            setTribe(t);
            setIsEditOpen(false);
          }}
          onDelete={handleDeleteTribe}
          allUsers={allUsers}
          onManageMembers={() => {
            setIsEditOpen(false);
            setIsMembersOpen(true);
          }}
        />
      )}

      {tribe && (
        <TribeMembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          memberIds={tribe.members}
          userMap={userMap}
          ownerId={typeof tribe.owner === 'string' ? tribe.owner : ((tribe.owner as any)?.id || (tribe.owner as any)?._id)}
          currentUserId={currentUser?.id}
          canKick={Boolean(currentUser) && (currentUser?.id === (typeof tribe.owner === 'string' ? tribe.owner : ((tribe.owner as any)?.id || (tribe.owner as any)?._id)))}
          onKick={handleKickMember}
        />
      )}

      {isCampfireOpen && tribe && (
        <CampfireOverlay onClick={() => setIsCampfireOpen(false)}>
          <CampfireModal onClick={(event) => event.stopPropagation()}>
            <CampfireHeader>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Flame size={18} /> Campfire</h3>
              <CampfireClose onClick={() => setIsCampfireOpen(false)} aria-label="Close Campfire">
                <X size={18} />
              </CampfireClose>
            </CampfireHeader>
            {(() => {
              const activeMembers = tribe.members
                .map(mId => userMap.get(mId))
                .filter((u): u is User => !!u && onlineUsers.includes(u.id));
              return (
                <>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '0 0 12px' }}>
                    {activeMembers.length} active now
                  </p>
                  {activeMembers.length === 0 ? (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0', fontSize: '0.9rem' }}>No one is online right now</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {activeMembers.map(user => (
                        <div
                          key={user.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 4px',
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : 'var(--color-secondary)',
                              border: '2px solid #22c55e',
                            }} />
                            <div style={{
                              position: 'absolute', bottom: 0, right: 0,
                              width: 10, height: 10, borderRadius: '50%',
                              background: '#22c55e',
                              border: '2px solid var(--color-card-bg)',
                            }} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              @{user.username} · <span style={{ color: '#22c55e' }}>Online</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </CampfireModal>
        </CampfireOverlay>
      )}

      <ConfirmationModal
        isOpen={isLeaveConfirmOpen}
        title="Leave Tribe"
        message={leavePrompt}
        confirmText="Leave"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setIsLeaveConfirmOpen(false)}
        onConfirm={performJoinToggle}
      />
    </>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

export default TribeDetailPage;
