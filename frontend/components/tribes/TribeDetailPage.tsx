import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { useGlobalContent } from '../../contexts/GlobalContentContext';
import TribeMessageArea from '../chat/TribeMessageArea';
import TribeMembersModal from './TribeMembersModal';
import EditTribeModal from './EditTribeModal';
import { Users, ArrowLeft, Edit2, LogIn, LogOut, Flame, X } from 'lucide-react';
import { toast } from '../common/Toast';
import ConfirmationModal from '../common/ConfirmationModal';

/* ───────────── STYLES ───────────── */
const PageContainer = styled.div`
  height: calc(var(--dvh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  min-height: 0;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 14px;
  background: ${({ theme }) => theme.cardBackground};
  /* border-bottom removed for clean look */
  display: flex;
  align-items: center;
  gap: 12px;
  
  /* Mobile: Sticky header that stays at top */
  position: sticky;
  top: 0;
  z-index: 100;
  
  /* Safe area support for notched devices */
  padding-top: max(14px, env(safe-area-inset-top));
  
  @media (max-width: 640px) {
    padding: 10px;
    padding-top: max(10px, env(safe-area-inset-top));
    gap: 8px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
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
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
`;

const CampfireModal = styled.div`
  width: min(480px, 100%);
  background: ${({ theme }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px 20px 0 0;
  padding: 20px;
  box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.3);
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

  // Resolve ID: Prefer prop (from App.tsx manual routing) -> Then param (if used in Route)
  const id = propTribeId || params.tribeId;

  const { socket, joinRoom, leaveRoom, clearUnreadTribe } = useSocket();
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
      // 1. Verify it belongs to this tribe
      if (message.tribeId !== id) return;

      setMessages(prev => {
        // 2. Prevent processing if message with same ID already exists
        const exists = prev.some(m => m.id === message.id || (m as any)._id === message.id);
        if (exists) return prev;

        // 3. Ensure sender is populated (fallback to cached user map)
        const fullMessage = { ...message };
        if (!fullMessage.sender || typeof fullMessage.sender === 'string' || !fullMessage.sender.name) {
          const foundUser = userMap.get(message.senderId);
          if (foundUser) {
            fullMessage.sender = foundUser;
          }
        }

        // 4. Handle Optimistic Replacement
        // If we have a temp message that matches this new real message (by tempId content), replace it.
        // The server response usually handles the replacement, but the socket event might arrive first.
        const tempMatchIndex = prev.findIndex(m => (m as any).id === `temp-${(fullMessage as any).tempId}`);

        let nextMessages = prev;
        if (tempMatchIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempMatchIndex] = fullMessage;
          nextMessages = newMessages;
        } else {
          nextMessages = [...prev, fullMessage].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }

        const cacheEntry = messageCache.current.get(id);
        messageCache.current.set(id, {
          messages: nextMessages,
          hasMore: cacheEntry?.hasMore ?? false,
          oldestTimestamp: cacheEntry?.oldestTimestamp,
        });

        return nextMessages;
      });

      // Clear unread count immediately since we are viewing it
      if (document.visibilityState === 'visible') {
        clearUnreadTribe(id);
      }
    };

    socket.on('newTribeMessage', handleIncoming);

    return () => {
      socket.off('newTribeMessage', handleIncoming);
    };
  }, [socket, id, isMember, userMap, clearUnreadTribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    setMessages(prev => [...prev, optimistic]);
    const cachedEntry = messageCache.current.get(id);
    messageCache.current.set(id, {
      messages: [...(cachedEntry?.messages || []), optimistic],
      hasMore: cachedEntry?.hasMore ?? false,
      oldestTimestamp: cachedEntry?.oldestTimestamp,
    });
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

      setMessages(prev => prev.map(m => (m.id === optimistic.id ? { ...responseMessage, status: undefined } : m)));
      const updatedEntry = messageCache.current.get(id);
      if (updatedEntry) {
        messageCache.current.set(id, {
          ...updatedEntry,
          messages: updatedEntry.messages.map(m => (m.id === optimistic.id ? { ...responseMessage, status: undefined } : m)),
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? { ...m, status: 'failed' } : m)));
      const updatedEntry = messageCache.current.get(id);
      if (updatedEntry) {
        messageCache.current.set(id, {
          ...updatedEntry,
          messages: updatedEntry.messages.map(m => (m.id === optimistic.id ? { ...m, status: 'failed' } : m)),
        });
      }
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

  /* ───────────── ALWAYS SHOW CHAT UI (NO LOADING SCREEN) ───────────── */
  return (
    <PageContainer>
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
            <span>{tribe?.members?.length || 0} members</span>
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 relative">
        {isLoading && !tribe ? (
          /* LOADING STATE - MIMIC CHAT SHELL */
          <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* No Header here, it's above in PageContainer */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-secondary">Loading tribe...</p>
              </div>
            </div>
            {/* Placeholder Input */}
            <div className="flex-none bg-background border-t border-border px-3 py-2 pb-[env(safe-area-inset-bottom)]">
              <div className="w-full h-11 bg-surface border border-border rounded-lg flex items-center px-4 opacity-50">
                <span className="text-secondary text-sm">Loading...</span>
              </div>
            </div>
          </div>
        ) : isMember && tribe ? (
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
          />
        ) : (
          /* JOIN PROMPT */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-2">
              <Users size={48} className="text-secondary opacity-50" />
            </div>
            <h2 className="text-xl font-bold">Join {tribe?.name || 'Tribe'}</h2>
            <p className="text-secondary max-w-sm">Join this tribe to start chatting with members and share your thoughts.</p>
            <button
              onClick={handleJoinToggle}
              className="mt-4 px-8 py-3 bg-accent text-accent-text font-bold rounded-full hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
            >
              Join Tribe
            </button>
          </div>
        )}
      </div>

      <div ref={bottomRef} />

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
        />
      )}

      {tribe && (
        <TribeMembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          memberIds={tribe.members}
          userMap={userMap}
          ownerId={typeof tribe.owner === 'string' ? tribe.owner : tribe.owner.id}
        />
      )}

      {isCampfireOpen && (
        <CampfireOverlay onClick={() => setIsCampfireOpen(false)}>
          <CampfireModal onClick={(event) => event.stopPropagation()}>
            <CampfireHeader>
              <h3>Campfire</h3>
              <CampfireClose onClick={() => setIsCampfireOpen(false)} aria-label="Close Campfire">
                <X size={18} />
              </CampfireClose>
            </CampfireHeader>
            <CampfireBody>Coming soon.</CampfireBody>
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
    </PageContainer>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

export default TribeDetailPage;
