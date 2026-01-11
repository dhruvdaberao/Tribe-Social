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
  // Initial Fetch
  useEffect(() => {
    if (!id || id === 'undefined') return;

    const fetchDetails = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Tribe Details & Users FIRST (Public info)
        const [tribeRes, usersRes] = await Promise.all([
          api.fetchTribe(id),
          api.fetchUsers()
        ]);

        if (tribeRes.data) {
          const fetchedTribe = tribeRes.data;
          setTribe(fetchedTribe);
          setAllUsers(usersRes.data);

          // 2. Check Membership
          const isMember = currentUser && fetchedTribe.members.includes(currentUser.id);
          const isOwner = currentUser && fetchedTribe.owner === currentUser.id;

          // 3. Fetch Messages ONLY if member/owner
          if (isMember || isOwner) {
            try {
              const messagesRes = await api.fetchTribeMessages(id);
              setMessages(messagesRes.data);
            } catch (msgErr) {
              console.warn("Could not fetch messages (likely not a member yet)", msgErr);
              // Do not fail the whole page, just empty messages
              setMessages([]);
            }
          }
        } else {
          setError("Tribe not found.");
        }
      } catch (err: any) {
        console.error("Failed to load tribe details", err);
        if (err.response && err.response.status === 404) {
          setError("Tribe not found.");
        } else {
          setError("Failed to load tribe data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, currentUser?.id]); // Re-run if user changes (rare but safe)

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
    if (!text.trim() || !id || !currentUser) return;

    // OPTIMISTIC UPDATE
    const tempId = Date.now().toString();
    const optimisticMsg: TribeMessage = {
      _id: tempId,
      tribeId: id,
      sender: currentUser,
      senderId: currentUser.id,
      text: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      const { data: sentMsg } = await api.sendTribeMessage(id, { text });
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m._id === tempId ? sentMsg : m));
    } catch (err) {
      console.error("Failed to send", err);
      // Rollback
      setMessages(prev => prev.filter(m => m._id !== tempId));
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleJoinTribe = async () => {
    if (!tribe || !id || !currentUser) return;

    // OPTIMISTIC UPDATE
    // Determine new state
    const alreadyMember = tribe.members.includes(currentUser.id);
    const newMembers = alreadyMember
      ? tribe.members.filter(m => m !== currentUser.id)
      : [...tribe.members, currentUser.id];

    // Create optimistic tribe object
    const optimisticTribe = { ...tribe, members: newMembers };
    setTribe(optimisticTribe);

    try {
      const { data: updatedTribe } = await api.joinTribe(id);
      if (updatedTribe) {
        setTribe(updatedTribe);
        // If we just joined, we should fetch messages
        if (!alreadyMember) {
          const msgRes = await api.fetchTribeMessages(id);
          setMessages(msgRes.data);
        }
      }
    } catch (err) {
      console.error("Join failed", err);
      // Revert on failure
      setTribe(tribe);
      alert("Failed to join tribe");
    }
  };
  // ... handleLeaveTribe (can use same logic or keep separate) ...

  const handleLeaveTribe = async () => {
    await handleJoinTribe(); // Compose into one logic since API is a toggle usually, or keep explicit if preferred
  };

  // This handles the delete action directly, to be passed to modal
  const handleDeleteFromModal = async (tribeId: string) => {
    try {
      if (!tribe || !id) return;
      await api.deleteTribe(tribeId);
      navigate('/tribes');
    } catch (err) {
      console.error("Failed to delete tribe via modal", err);
      alert("Failed to delete tribe. Please try again.");
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
          <Avatar $src={tribe?.avatarUrl} />
          <HeaderInfo>
            <h2>{tribe?.name}</h2>
            <p style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsMembersModalOpen(true)}>{tribe?.members?.length || 0} members</p>
          </HeaderInfo>
        </div>
        <HeaderActions>
          <ActionButton onClick={() => setIsMembersModalOpen(true)} title="View Members">
            <Users size={18} />
          </ActionButton>

          {/* Admin Actions - ONLY Edit here, Delete is inside Edit Modal */}
          {currentUser && tribe.owner === currentUser.id && (
            <ActionButton onClick={() => setIsEditModalOpen(true)} title="Edit Tribe"><Edit2 size={18} /></ActionButton>
          )}

          {/* Join/Leave */}
          {currentUser && tribe.owner !== currentUser.id && (
            tribe.members.includes(currentUser.id) ? (
              <ActionButton onClick={handleJoinTribe} title="Leave Tribe"><LogOut size={18} /></ActionButton>
            ) : (
              <button
                onClick={handleJoinTribe}
                style={{ background: '#d4a373', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 'bold', color: '#2A2320', cursor: 'pointer' }}
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
