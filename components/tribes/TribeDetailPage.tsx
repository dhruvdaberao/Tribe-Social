import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical, Trash2, Edit2, LogOut } from 'lucide-react';
import EditTribeModal from './EditTribeModal';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  height: calc(100vh - 60px); // Adjust based on navbar height
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  padding: 16px 24px;
  background: ${({ theme }) => theme.cardBackground};
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  &:hover { background: ${({ theme }) => theme.hoverBackground}; }
`;

const HeaderInfo = styled.div`
  flex: 1;
  h2 { margin: 0; font-size: 1.2rem; color: ${({ theme }) => theme.text}; }
  p { margin: 4px 0 0; font-size: 0.85rem; color: ${({ theme }) => theme.textSecondary}; }
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${({ theme }) => theme.background};
`;

const MessageBubble = styled.div<{ $isSelf: boolean }>`
  align-self: ${({ $isSelf }) => $isSelf ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  display: flex;
  flex-direction: column;
  align-items: ${({ $isSelf }) => $isSelf ? 'flex-end' : 'flex-start'};
`;

const BubbleContent = styled.div<{ $isSelf: boolean }>`
  background: ${({ $isSelf, theme }) => $isSelf ? '#FF5722' : theme.cardBackground}; // Brand color for self
  color: ${({ $isSelf, theme }) => $isSelf ? 'white' : theme.text};
  padding: 10px 16px;
  border-radius: 12px;
  border-${({ $isSelf }) => $isSelf ? 'bottom-right' : 'bottom-left'}-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  word-break: break-word;
`;

const SenderName = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 4px;
  margin-left: 8px;
`;

const InputArea = styled.form`
  padding: 16px 24px;
  background: ${({ theme }) => theme.cardBackground};
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
  
  &:focus { outline: 2px solid #FF5722; border-color: transparent; }
`;

const SendButton = styled.button`
  background: #FF5722;
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface TribeDetailPageProps {
  currentUser: User | null;
  tribeId?: string; // Optional prop override
}

const TribeDetailPage: React.FC<TribeDetailPageProps> = ({ currentUser, tribeId: propTribeId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use prop if available, otherwise param
  const id = propTribeId || paramId;
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initial Fetch
  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        // 1. Fetch Tribe Info (Usually fast if cached in list, but we fetch fresh)
        // Note: We might want to pass tribe via location state to skip this, but for reliability we fetch.
        // Assuming we might have a getTribeById endpoint or we filter from list. 
        // Since Phase 1 didn't explicitly mandate getTribeById, let's assuming we might need to fetch all or we added it.
        // WAIT: Phase 1 implementation didn't include `GET /api/tribes/:id`.
        // FIX: We will fetch ALL tribes and find ours, or just implement the endpoint quickly if missing.
        // Given the instructions said "GET /api/tribes MUST return ALL", we can use that if :id endpoint missing.
        // BUT better practice: Let's assume frontend logic to find it or fetch specifically. 
        // For now, let's try reading from existing cache first for instant load.

        const { data: allTribes } = await api.fetchTribes();
        const foundTribe = allTribes.find((t: Tribe) => t.id === id);

        if (foundTribe) {
          setTribe(foundTribe);
          // 2. Fetch Messages
          const { data: msgs } = await api.fetchTribeMessages(id);
          setMessages(msgs);
        } else {
          setError("Tribe not found.");
        }
        setIsLoading(false);

      } catch (err) {
        console.error("Failed to load tribe details", err);
        setError("Failed to load conversation.");
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Socket Listener
  useEffect(() => {
    if (!socket || !id) return;

    const handleNewMessage = (msg: TribeMessage) => {
      // Only add if belongs to this tribe (safety check)
      // Note: msg.tribe might be an object or string ID depending on population
      const msgTribeId = typeof msg.tribe === 'object' ? msg.tribe.id : msg.tribe;
      if (msgTribeId === id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    };

    socket.on('newTribeMessage', handleNewMessage);

    return () => {
      socket.off('newTribeMessage', handleNewMessage);
    };
  }, [socket, id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    setIsSending(true);
    try {
      await api.sendTribeMessage(id, newMessage);
      setNewMessage('');
      // Message update handled by socket usually, but for instant UI we can append optimistic?
      // Phase 1 implementation emits socket event from backend, so we wait for that to avoid dups.
    } catch (err) {
      console.error("Failed to send", err);
      // Optionally show toast error
    } finally {
      setIsSending(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!tribe || !id || !currentUser) return;
    try {
      const { data: updatedTribe } = await api.joinLeaveTribe(id);
      setTribe(updatedTribe);
    } catch (err) {
      console.error("Join/Leave failed", err);
    }
  };

  const handleDelete = async () => {
    if (!tribe || !id || !window.confirm("Are you sure? This will delete the tribe and all messages forever.")) return;
    try {
      await api.deleteTribe(id);
      navigate('/tribes');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (isLoading) return <PageContainer><div style={{ padding: 20 }}>Loading conversation...</div></PageContainer>;
  if (error || !tribe) return <PageContainer><div style={{ padding: 20 }}>Error: {error}</div></PageContainer>;

  const isMember = currentUser && tribe.members.includes(currentUser.id);
  const isOwner = currentUser && tribe.owner === currentUser.id;

  return (
    <PageContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton onClick={() => navigate('/tribes')}><ArrowLeft /></BackButton>
          <img
            src={tribe.avatarUrl || '/default-tribe.png'}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
          />
          <HeaderInfo>
            <h2>{tribe.name}</h2>
            <p>{tribe.members.length} members</p>
          </HeaderInfo>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isMember && (
            <button onClick={handleJoinLeave} style={{ padding: '8px 16px', borderRadius: 20, background: '#FF5722', color: 'white', border: 'none', cursor: 'pointer' }}>
              Join Tribe
            </button>
          )}
          {isMember && !isOwner && (
            <button onClick={handleJoinLeave} title="Leave Tribe" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={20} color="#666" />
            </button>
          )}
          {isOwner && (
            <>
              <button onClick={() => setIsEditModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={20} color="#666" /></button>
              <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} color="red" /></button>
            </>
          )}
        </div>
      </Header>

      <ChatArea>
        {messages.map((msg, idx) => {
          const isSelf = currentUser ? msg.sender.id === currentUser.id : false;
          return (
            <MessageBubble key={msg.id || idx} $isSelf={isSelf}>
              {!isSelf && <SenderName>{msg.sender.name}</SenderName>}
              <BubbleContent $isSelf={isSelf}>{msg.text}</BubbleContent>
            </MessageBubble>
          );
        })}
        <div ref={messagesEndRef} />
      </ChatArea>

      {isMember ? (
        <InputArea onSubmit={handleSendMessage}>
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <SendButton type="submit" disabled={isSending || !newMessage.trim()}>
            <Send size={20} />
          </SendButton>
        </InputArea>
      ) : (
        <div style={{ padding: 20, textAlign: 'center', color: '#888', background: '#f5f5f5' }}>
          Join this tribe to start chatting
        </div>
      )}

      {isEditModalOpen && (
        <EditTribeModal
          tribe={tribe}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => { setTribe(updated); setIsEditModalOpen(false); }}
        />
      )}
    </PageContainer>
  );
};

export default TribeDetailPage;
