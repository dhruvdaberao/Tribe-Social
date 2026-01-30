import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Tribe, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Edit2, Users } from 'lucide-react';
import * as api from '../../api';
import { toast } from '../common/Toast';
import TribeMembersModal from './TribeMembersModal';

const Card = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 1rem; // 16px (Spec)
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); // Consider updating to spec shadow later if provided
  transition: transform 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem; // 24px (Spec Global Padding)
  text-align: center;
  border: 1px solid ${({ theme }) => theme.border};
  position: relative; // For absolute positioning of Edit icon

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.primary};
  }
`;

const EditIconWrapper = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: ${({ theme }) => theme.primary}; // Brown
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  z-index: 10;
  
  &:hover {
    background: ${({ theme }) => theme.hoverBackground}; // Light hover
  }
`;

const AvatarCircle = styled.div`
  width: 5rem; // 80px (Spec)
  height: 5rem; // 80px (Spec)
  border-radius: 50%;
  background-color: ${({ theme }) => theme.secondary};
  margin-bottom: 1rem;
  border: 4px solid ${({ theme }) => theme.background};
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;
// ... (skip lines)

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  height: 2.5rem; // 40px (Spec)
  padding: 0 1rem; // Vertical center, horizontal 1rem
  border-radius: 0.75rem; // 12px (Spec Inner Component)
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $variant, theme }) => $variant === 'primary' ? `
    background: ${theme.primary};
    color: #2A2320; // Dark Brown Text for Contrast
    border: none;
  ` : `
    background: transparent;
    border: 1px solid ${theme.textSecondary};
    color: ${theme.text};
  `}

  &:hover {
    opacity: 0.9;
    background: ${({ $variant, theme }) => $variant === 'primary' ? theme.hover : 'transparent'};
  }
`;

const TribeName = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const MemberCount = styled.p`
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Quote = styled.p`
  color: ${({ theme }) => theme.text};
  font-style: italic;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
  line-height: 1.4;
  padding: 0 0.5rem; // Horizontal padding 8px (Spec)
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: auto;
`;



interface TribeCardProps {
  tribe: Tribe;
  currentUser: User | null;
  allUsers: User[];
  onEdit?: (tribe: Tribe) => void;
  onViewProfile?: (user: User) => void;
  onJoinToggle?: (tribeId: string) => Promise<void>;
  unreadCount?: number;
}

const TribeCard: React.FC<TribeCardProps> = ({ tribe, currentUser, allUsers, onEdit, onViewProfile, onJoinToggle, unreadCount }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMember = currentUser && tribe.members.includes(currentUser.id);
  const isOwner = currentUser && tribe.owner === currentUser.id;
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);

  const userMap = React.useMemo(() => {
    return new Map(allUsers.map(u => [u.id, u]));
  }, [allUsers]);

  // We need a userMap for the modal. Since we don't have it passed down from TribesPage yet,
  // we will accept it as a prop.
  // Note: TribesPage needs to pass `allUsers` map or array.

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tribe.id || !onJoinToggle || !currentUser) {
      console.error('Cannot join tribe: Missing required data', {
        tribeId: tribe.id,
        hasOnJoinToggle: !!onJoinToggle,
        hasCurrentUser: !!currentUser
      });
      toast.error('Unable to join tribe. Please try again.');
      return;
    }

    console.log('Attempting to join tribe:', tribe.name, tribe.id);
    setIsJoining(true);

    try {
      await onJoinToggle(tribe.id);
      console.log('Successfully joined tribe:', tribe.name);
      toast.success(`Joined ${tribe.name}!`);
    } catch (error) {
      console.error('Join error:', error);
      toast.error('Failed to join tribe. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };


  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tribe.id || !onJoinToggle) {
      console.error('Cannot leave tribe: Missing required data');
      toast.error('Unable to leave tribe. Please try again.');
      return;
    }

    if (!confirm(`Leave ${tribe.name}?`)) return;

    console.log('Attempting to leave tribe:', tribe.name, tribe.id);
    setIsJoining(true);

    try {
      await onJoinToggle(tribe.id);
      console.log('Successfully left tribe:', tribe.name);
      toast.success(`Left ${tribe.name}`);
    } catch (error) {
      console.error('Leave error:', error);
      toast.error('Failed to leave tribe. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };


  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(tribe);
  };

  const handleMembersClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMembersModalOpen(true);
  }

  return (
    <>
      <Card>
        {isOwner && onEdit && (
          <EditIconWrapper onClick={handleEditClick} title="Edit Tribe">
            <Edit2 size={18} strokeWidth={2} />
          </EditIconWrapper>
        )}

        <AvatarCircle>
          {tribe.avatarUrl ? (
            <AvatarImage src={tribe.avatarUrl} alt={tribe.name} />
          ) : (
            <Users size={32} color="#D6B9A0" /> // Minimalistic group icon, light brown
          )}
          {unreadCount !== undefined && unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#ef4444', // Red 500
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white', // Contrast border
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </AvatarCircle>

        <TribeName>{tribe.name}</TribeName>
        <MemberCount onClick={handleMembersClick} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {tribe.members.length} members
        </MemberCount>

        <Quote>"{tribe.description}"</Quote>

        <ButtonGroup>
          {isMember && (
            <>
              <Button $variant="secondary" onClick={(e) => {
                e.stopPropagation();
                navigate(`/tribes/${tribe.id}`);
              }}>
                Chat
              </Button>
              {!isOwner && (
                <Button
                  $variant="primary"
                  onClick={handleLeave}
                  disabled={isJoining}
                  style={{ color: theme.text }}
                >
                  {isJoining ? 'Leaving...' : 'Leave'}
                </Button>
              )}
            </>
          )}

          {!isMember && (
            <Button
              $variant="primary"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          )}
        </ButtonGroup>
      </Card>

      <TribeMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        memberIds={tribe.members}
        userMap={userMap}
        onViewProfile={(user) => {
          setIsMembersModalOpen(false);
          if (onViewProfile) onViewProfile(user);
        }}
      />
    </>
  );
};

export default TribeCard;
