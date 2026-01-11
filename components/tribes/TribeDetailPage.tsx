import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import TribeMessageArea from '../chat/TribeMessageArea';
import TribeMembersModal from './TribeMembersModal';
import EditTribeModal from './EditTribeModal';
import { Users, ArrowLeft, Edit2, LogIn, LogOut } from 'lucide-react';

/* ───────────── STYLES ───────────── */
const PageContainer = styled.div`
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  padding: 14px;
  background: ${({ theme }) => theme.cardBackground};
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  align-items: center;
  gap: 12px;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: ${({ theme }) => theme.textSecondary};
`;

/* ───────────── COMPONENT ───────────── */
interface Props {
  currentUser: User | null;
}

const TribeDetailPage: React.FC<Props> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { socket, joinRoom, leaveRoom, clearUnreadTribe } = useSocket();

  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [areMessagesLoading, setAreMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);

  /* ───────────── LOAD TRIBE FIRST ───────────── */
  useEffect(() => {
    if (!id) return;

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

        if (err.code === 'ECONNABORTED') {
          setError('Server is waking up (cold start). Retrying in 5 seconds...');
          // Auto-retry after timeout
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        } else if (err.response?.status === 404) {
          setError('Tribe not found');
          setTimeout(() => navigate('/tribes'), 2000);
        } else {
          setError('Failed to load tribe. Redirecting...');
          setTimeout(() => navigate('/tribes'), 2000);
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

  /* ───────────── LOAD MESSAGES ───────────── */
  useEffect(() => {
    if (!id || !isMember) return;

    const loadMessages = async () => {
      try {
        setAreMessagesLoading(true);
        const res = await api.fetchTribeMessages(id);
        setMessages(res.data);
        clearUnreadTribe(id);
      } finally {
        setAreMessagesLoading(false);
      }
    };

    loadMessages();
  }, [id, isMember, clearUnreadTribe]);

  /* ───────────── JOIN SOCKET ROOM (CRITICAL) ───────────── */
  useEffect(() => {
    if (!id || !isMember) return;

    const room = id;
    joinRoom(room);
    return () => leaveRoom(room);
  }, [id, isMember, joinRoom, leaveRoom]);

  /* ───────────── REAL-TIME RECEIVE ───────────── */
  useEffect(() => {
    if (!socket || !id || !isMember) return;

    const handleIncoming = (message: TribeMessage) => {
      if (message.tribeId !== id) return;

      setMessages(prev =>
        prev.some(m => m.id === message.id)
          ? prev
          : [...prev, message]
      );
    };

    socket.on('newTribeMessage', handleIncoming);
    return () => {
      socket.off('newTribeMessage', handleIncoming);
    };
  }, [socket, id, isMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ───────────── SEND MESSAGE ───────────── */
  const handleSend = async (text: string) => {
    if (!text.trim() || !id || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: TribeMessage = {
      id: tempId,
      tribeId: id,
      sender: currentUser,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimistic]);
    setIsSending(true);

    try {
      const { data } = await api.sendTribeMessage(id, { text });
      setMessages(prev => prev.map(m => (m.id === tempId ? data : m)));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  /* ───────────── JOIN / LEAVE ───────────── */
  const handleJoinToggle = async () => {
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

  const userMap = useMemo(
    () => new Map(allUsers.map(u => [u.id, u])),
    [allUsers]
  );

  /* ───────────── LOADING STATE ───────────── */
  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate('/tribes')}>
            <ArrowLeft size={20} />
          </BackButton>
          <h3>Loading tribe...</h3>
        </Header>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16
        }}>
          <img src="/busstop.gif" alt="Loading" style={{ width: 80 }} />
          <p>Loading tribe details...</p>
        </div>
      </PageContainer>
    );
  }

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

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/tribes')}>
          <ArrowLeft size={20} />
        </BackButton>

        <Avatar $src={tribe?.avatarUrl}>
          {!tribe?.avatarUrl && <Users size={20} color="#D6B9A0" />}
        </Avatar>

        <HeaderInfo>
          <h2>{tribe?.name || 'Loading…'}</h2>
          <p onClick={() => setIsMembersOpen(true)}>
            {tribe?.members.length || 0} members
          </p>
        </HeaderInfo>

        <HeaderActions>
          <ActionButton onClick={() => setIsMembersOpen(true)}>
            <Users size={18} />
          </ActionButton>

          {currentUser && tribe?.owner === currentUser.id && (
            <ActionButton onClick={() => setIsEditOpen(true)}>
              <Edit2 size={18} />
            </ActionButton>
          )}

          {currentUser && tribe?.owner !== currentUser.id && (
            <ActionButton onClick={handleJoinToggle}>
              {isMember ? <LogOut size={18} /> : <LogIn size={18} />}
            </ActionButton>
          )}
        </HeaderActions>
      </Header>

      {isMember ? (
        <TribeMessageArea
          tribe={tribe!}
          messages={messages}
          isLoading={areMessagesLoading}
          currentUser={currentUser!}
          isSending={isSending}
          onSendMessage={handleSend}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p>Join this tribe to start chatting</p>
          <button onClick={handleJoinToggle}>Join Tribe</button>
        </div>
      )}

      <div ref={bottomRef} />

      {isEditOpen && tribe && (
        <EditTribeModal
          tribe={tribe}
          onClose={() => setIsEditOpen(false)}
          onSuccess={t => {
            setTribe(t);
            setIsEditOpen(false);
          }}
        />
      )}

      {tribe && (
        <TribeMembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          memberIds={tribe.members}
          userMap={userMap}
        />
      )}
    </PageContainer>
  );
};

export default TribeDetailPage;
