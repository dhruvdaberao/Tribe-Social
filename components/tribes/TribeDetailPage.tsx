import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Tribe, TribeMessage, User } from '../../types';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import TribeMessageArea from '../chat/TribeMessageArea';
import TribeMembersModal from './TribeMembersModal';
import EditTribeModal from './EditTribeModal';
import { Users, ArrowLeft, Edit2, Trash2, LogOut } from 'lucide-react';

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
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover { color: ${({ theme }) => theme.primary}; }
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
  // const [newMessage, setNewMessage] = useState(''); // Moved to MessageArea
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Initial Fetch
  useEffect(() => {
    // CRITICAL FIX: Do not fetch if ID is undefined or 'undefined' string
    if (!id || id === 'undefined') {
      // console.log("TribeDetailPage: ID is missing, skipping fetch.");
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);

        // Parallel Fetch: Tribe, Messages, Users (for modal)
        const [tribeRes, messagesRes, usersRes] = await Promise.all([
          api.fetchTribe(id),
          api.fetchTribeMessages(id),
          api.fetchUsers()
        ]);

        if (tribeRes.data) {
          setTribe(tribeRes.data);
          setMessages(messagesRes.data);
          setAllUsers(usersRes.data);
        } else {
          setError("Tribe not found.");
        }
      } catch (err: any) {
        console.error("Failed to load tribe details", err);
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
    if (!socket || !id || id === 'undefined') return;

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

  const userMap = React.useMemo(() => {
    return new Map(allUsers.map(u => [u.id, u]));
  }, [allUsers]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !id) return;

    setIsSending(true);
    try {
      await api.sendTribeMessage(id, { text });
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleJoinTribe = async () => {
    if (!tribe || !id || !currentUser) return;
    try {
      const { data: updatedTribe } = await api.joinTribe(id);
      setTribe(updatedTribe);
    } catch (err) {
      console.error("Join failed", err);
    }
  };

  const handleLeaveTribe = async () => {
    if (!tribe || !id || !currentUser) return;
    try {
      const { data: updatedTribe } = await api.joinTribe(id);
      setTribe(updatedTribe);
    } catch (err) {
      console.error("Leave failed", err);
    }
  };

  // This handles the delete action directly, to be passed to modal
  const handleDeleteFromModal = async (tribeId: string) => {
    try {
      await api.deleteTribe(tribeId);
      navigate('/tribes');
    } catch (err) {
      console.error("Failed to delete tribe via modal", err);
      alert("Failed to delete tribe. Please try again.");
    }
  };

  const handleDeleteTribe = async () => {
    // Legacy handler if called from header (kept for safety, but header now uses modal usually)
    if (!tribe || !id || !window.confirm("Are you sure? This will delete the tribe and all messages forever.")) return;
    try {
      await api.deleteTribe(id);
      navigate('/tribes');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (isLoading) return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <img src="/busstop.gif" alt="Loading..." style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
        <p style={{ marginTop: 16, color: '#888' }}>Entering tribe territory...</p>
      </div>
    </PageContainer>
  );

  if (error || !tribe) return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/tribes')}><ArrowLeft size={20} /></BackButton>
        <h2 style={{ marginLeft: 10 }}>Error</h2>
      </Header>
      <div style={{ padding: 40, textAlign: 'center', color: '#b19786ff' }}>
        <h3>{error || "Tribe not found"}</h3>
        <button onClick={() => navigate('/tribes')} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#333', color: 'white', cursor: 'pointer' }}>Back to Tribes</button>
      </div>
    </PageContainer>
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
            <p style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsMembersModalOpen(true)}>{tribe.members.length} members</p>
          </HeaderInfo>
        </div>
        <HeaderActions>
          <ActionButton onClick={() => setIsMembersModalOpen(true)} title="View Members">
            <Users size={18} />
            <span style={{ fontSize: '0.8rem', display: 'none' }} className="md:inline">Members</span>
          </ActionButton>

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

      {/* MESSAGE AREA */}
      {currentUser && tribe.members.includes(currentUser.id) ? (
        <TribeMessageArea
          tribe={tribe}
          messages={messages}
          isLoading={isLoading}
          currentUser={currentUser}
          isSending={isSending}
          onSendMessage={handleSendMessage}
          onViewProfile={(user) => {
            // Navigate to profile? For now just log or do nothing, or maybe show modal
            // navigate(`/profile/${user.id}`); 
          }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#888', gap: 16 }}>
          <p>Join this tribe to start chatting!</p>
          <button
            onClick={handleJoinTribe}
            style={{ background: '#d4a373', border: 'none', padding: '10px 24px', borderRadius: 20, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            Join Tribe
          </button>
        </div>
      )}

      {isEditModalOpen && (
        <EditTribeModal
          tribe={tribe}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => { setTribe(updated); setIsEditModalOpen(false); }}
          onDelete={handleDeleteFromModal}
        />
      )}

      <TribeMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        memberIds={tribe.members}
        userMap={userMap}
        onViewProfile={(user) => {
          setIsMembersModalOpen(false);
          // navigate(`/profile/${user.id}`); 
        }}
      />
    </PageContainer>
  );
};

export default TribeDetailPage;
