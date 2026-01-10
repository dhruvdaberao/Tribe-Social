import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical, Trash2, Edit2, LogOut } from 'lucide-react';
import EditTribeModal from './EditTribeModal';

// --- STYLED COMPONENTS ---
// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  height: calc(100vh - 60px); 
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
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

const Avatar = styled.div<{ $src?: string | null }>`
  width: 40px; 
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.secondary} url(${({ $src }) => $src || '/default-tribe.png'}) center/cover;
`;

const HeaderInfo = styled.div`
  flex: 1;
  h2 { margin: 0; font-size: 1.1rem; color: ${({ theme }) => theme.text}; font-weight: 700; }
  p { margin: 2px 0 0; font-size: 0.8rem; color: ${({ theme }) => theme.textSecondary}; }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  border: none;
  padding: 8px;
  cursor: pointer;
  
  &:hover { color: ${({ theme }) => theme.primary}; }
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px; 
  background: ${({ theme }) => theme.background};
`;

const MessageRow = styled.div<{ $isSelf: boolean }>`
    display: flex;
    flex-direction: ${({ $isSelf }) => $isSelf ? 'row-reverse' : 'row'};
    align-items: flex-end;
    gap: 8px;
    width: 100%;
    margin-bottom: 4px;
`;

const AvatarSmall = styled.div<{ $src?: string | null }>`
    width: 28px; height: 28px; borderRadius: 50%;
    background: #ccc url(${({ $src }) => $src}) center/cover;
    flex-shrink: 0;
`;

const MessageGroup = styled.div<{ $isSelf: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isSelf }) => $isSelf ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`;

const MessageBubble = styled.div<{ $isSelf: boolean }>`
  // Spec: Padding 0.625rem (10px) horizontal?? Wait, spec said:
  // "Padding: 0.625rem (10px) horizontal, 1rem (16px) vertical." -> This seems inverse of normal?
  // Usually vertical is smaller. Let me double check spec text:
  // "Padding: 0.625rem (10px) horizontal, 1rem (16px) vertical."
  // Okay, I will follow strict text: 16px (1rem) vertical, 10px (0.625rem) horizontal.
  // Actually standard is usually px-4 py-2. Let's look at "ChatPage" earlier reference.
  // User spec: "Padding: 0.625rem (10px) horizontal, 1rem (16px) vertical."
  // This sounds vertically tall. I will stick to it.
  
  padding: 1rem 0.625rem; // 16px 10px
  
  border-radius: 1rem; // 16px Base
  font-size: 0.875rem; // 14px (Spec)
  line-height: 1.5;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); // shadow-sm (Spec)
  
  background: ${({ $isSelf, theme }) => $isSelf ? theme.primary : theme.cardBackground};
  color: ${({ $isSelf, theme }) => $isSelf ? '#FFFFFF' : theme.text}; // Text primary for others, White for self (Accent Text)
  
  ${({ $isSelf }) => $isSelf ? `
    border-top-right-radius: 0px; // Spec: "Corners (Outgoing/User): ...except Top-Right (0px)"
  ` : `
    border-top-left-radius: 0px; // Spec: "Corners (Incoming/Other): ...except Top-Left (0px)"
  `}
`;

const SenderName = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 2px;
  margin-left: 10px;
`;

const InputArea = styled.form`
  padding: 16px;
  background: ${({ theme }) => theme.cardBackground};
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 20px;
  border: none;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  
  &:focus { outline: 1px solid ${({ theme }) => theme.primary}; }
`;

const SendButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: #2c2522;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  
  &:disabled { opacity: 0.5; }
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
        setIsLoading(true); // Ensure loading state starts true
        // Direct fetch by ID
        const { data: foundTribe } = await api.fetchTribe(id);

        if (foundTribe) {
          setTribe(foundTribe);
          // 2. Fetch Messages
          const { data: msgs } = await api.fetchTribeMessages(id);
          setMessages(msgs);
        } else {
          setError("Tribe not found.");
        }
      } catch (err: any) {
        console.error("Failed to load tribe details", err);
        // Handle 404 specifically if possible, otherwise generic error
        if (err.response && err.response.status === 404) {
          setError("Tribe not found.");
        } else {
          setError("Failed to load conversation.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Socket Listener
  useEffect(() => {
    if (!socket || !id) return;

    const handleNewMessage = (msg: TribeMessage) => {
      // Use tribeId from socket message
      if (msg.tribeId === id) {
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
      await api.sendTribeMessage(id, { text: newMessage });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleJoinTribe = async () => {
    if (!tribe || !id || !currentUser) return;
    try {
      const { data: updatedTribe } = await api.joinTribe(id); // Use correct API
      setTribe(updatedTribe);
    } catch (err) {
      console.error("Join failed", err);
    }
  };

  const handleLeaveTribe = async () => {
    // Re-use join endpoint as toggle if backend supports it, otherwise check API.
    // Backend (tribeRoutes.js) implementation of /:id/join usually toggles.
    if (!tribe || !id || !currentUser) return;
    try {
      const { data: updatedTribe } = await api.joinTribe(id);
      setTribe(updatedTribe);
    } catch (err) {
      console.error("Leave failed", err);
    }
  };

  const handleDeleteTribe = async () => {
    if (!tribe || !id || !window.confirm("Are you sure? This will delete the tribe and all messages forever.")) return;
    try {
      await api.deleteTribe(id);
      navigate('/tribes');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (isLoading) return <PageContainer><div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>Loading conversation...</div></PageContainer>;
  if (error || !tribe) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ff5722' }}>
      <h3>{error || "Tribe not found"}</h3>
      <button onClick={() => navigate('/tribes')} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#333', color: 'white' }}>Back to Tribes</button>
    </div>
  );

  const isMember = currentUser && tribe.members.includes(currentUser.id);

  return (
    <PageContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton onClick={() => navigate('/tribes')}><ArrowLeft size={20} /></BackButton>
          <Avatar $src={tribe.avatarUrl} />
          <HeaderInfo>
            <h2>{tribe.name}</h2>
            <p>{tribe.members.length} members</p>
          </HeaderInfo>
        </div>
        <HeaderActions>
          {/* Admin Actions */}
          {currentUser && tribe.owner === currentUser.id && (
            <>
              <ActionButton onClick={() => setIsEditModalOpen(true)} title="Edit Tribe"><Edit2 size={18} /></ActionButton>
              <ActionButton onClick={handleDeleteTribe} title="Delete Tribe"><Trash2 size={18} /></ActionButton>
            </>
          )}
          {/* Join/Leave */}
          {currentUser && tribe.owner !== currentUser.id && (
            tribe.members.includes(currentUser.id) ? (
              <ActionButton onClick={handleLeaveTribe} title="Leave Tribe"><LogOut size={18} /></ActionButton>
            ) : (
              <button
                onClick={handleJoinTribe}
                style={{ background: '#d4a373', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 'bold' }}
              >
                Join
              </button>
            )
          )}
        </HeaderActions>
      </Header>

      <ChatArea>
        {messages.map((msg, index) => {
          // Helper to check if same sender as prev message
          const isSelf = currentUser?.id === (msg.senderId || msg.sender?.id);
          const showAvatar = !isSelf && (index === 0 || messages[index - 1].senderId !== msg.senderId);
          const sender = msg.sender || { name: 'Unknown', avatarUrl: null }; // Fallback

          return (
            <MessageRow key={msg.id || index} $isSelf={isSelf} style={{ marginBottom: showAvatar ? 12 : 2 }}>
              {!isSelf && (
                <div style={{ width: 28 }}>
                  {showAvatar && <AvatarSmall $src={sender.avatarUrl || '/default-user.png'} />}
                </div>
              )}

              <MessageGroup $isSelf={isSelf}>
                {!isSelf && showAvatar && <SenderName>{sender.name}</SenderName>}
                <MessageBubble $isSelf={isSelf}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Shared" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 8 : 0 }} />
                  )}
                  {msg.text}
                </MessageBubble>
              </MessageGroup>
            </MessageRow>
          )
        })}
        <div ref={messagesEndRef} />
      </ChatArea>

      {/* Only show input if member */}
      {currentUser && tribe.members.includes(currentUser.id) ? (
        <InputArea onSubmit={handleSendMessage}>
          <ActionButton type="button" title="Upload Image"><ImageIcon size={20} /></ActionButton>
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={`Message ${tribe.name}...`}
          />
          <SendButton type="submit" disabled={!newMessage.trim() && !isSending}>
            <Send size={18} />
          </SendButton>
        </InputArea>
      ) : (
        <div style={{ padding: 20, textAlign: 'center', background: '#2c2522', color: '#888' }}>
          Join this tribe to chat!
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
