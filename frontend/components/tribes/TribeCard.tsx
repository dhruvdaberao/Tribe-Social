import React from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit3, EyeOff, Flag, MoreVertical, Users } from 'lucide-react';
import { toast } from '../common/Toast';
import TribeMembersModal from './TribeMembersModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ReportModal from '../moderation/ReportModal';
import * as api from '../../api';

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
  position: relative; // For absolute positioning of menu

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.primary};
  }
`;

const MenuButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 999px;
  padding: 6px;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.hover};
  }
`;

const MenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
`;

const Menu = styled.div`
  position: absolute;
  top: 3rem;
  right: 1rem;
  width: 200px;
  background: ${({ theme }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  z-index: 50;
`;

const MenuItem = styled.button<{ $tone?: 'default' | 'danger' | 'warning' }>`
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? '#ef4444' : $tone === 'warning' ? '#f59e0b' : theme.text)};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.hover};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.border};
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

const AvatarEditButton = styled.button`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 2px solid ${({ theme }) => theme.cardBackground};
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.cardBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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

const InlineInput = styled.input`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 10px 36px 10px 12px;
  font-size: 1rem;
  font-weight: 600;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const InlineTextArea = styled.textarea`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 10px 36px 10px 12px;
  font-size: 0.95rem;
  line-height: 1.4;
  min-height: 80px;
  resize: none;
  margin-bottom: 1rem;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const InputIcon = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.textSecondary};
  pointer-events: none;
`;



interface TribeCardProps {
  tribe: Tribe;
  currentUser: User | null;
  allUsers: User[];
  onEdit?: (tribe: Tribe) => void;
  isEditing?: boolean;
  onCloseEdit?: () => void;
  onSaveEdit?: (tribe: Tribe) => void;
  onDeleteEdit?: () => void;
  onViewProfile?: (user: User) => void;
  onJoinToggle?: (tribeId: string) => Promise<void>;
  unreadCount?: number;
}

const TribeCard: React.FC<TribeCardProps> = ({
  tribe,
  currentUser,
  allUsers,
  onEdit,
  isEditing,
  onCloseEdit,
  onSaveEdit,
  onViewProfile,
  onJoinToggle,
  unreadCount
}) => {
  const navigate = useNavigate();
  const [localTribe, setLocalTribe] = React.useState(tribe);
  const isMember = !!currentUser && localTribe.members.includes(currentUser.id);
  const isOwner = !!currentUser && localTribe.owner === currentUser.id;
  const isAdmin = !!currentUser?.isAdmin || !!currentUser?.isSuperAdmin;
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = React.useState(false);
  const [leavePrompt, setLeavePrompt] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [moderationAction, setModerationAction] = React.useState<null | 'hide' | 'unhide'>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState({
    name: tribe.name,
    description: tribe.description,
    avatarUrl: tribe.avatarUrl || ''
  });
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const userMap = React.useMemo(() => {
    return new Map(allUsers.map(u => [u.id, u]));
  }, [allUsers]);

  React.useEffect(() => {
    setLocalTribe(tribe);
  }, [tribe]);

  React.useEffect(() => {
    if (isEditing) {
      setEditDraft({
        name: localTribe.name,
        description: localTribe.description,
        avatarUrl: localTribe.avatarUrl || ''
      });
      setIsMenuOpen(false);
    }
  }, [isEditing, localTribe]);

  // We need a userMap for the modal. Since we don't have it passed down from TribesPage yet,
  // we will accept it as a prop.
  // Note: TribesPage needs to pass `allUsers` map or array.

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localTribe.id || !onJoinToggle || !currentUser) {
      console.error('Cannot join tribe: Missing required data', {
        tribeId: localTribe.id,
        hasOnJoinToggle: !!onJoinToggle,
        hasCurrentUser: !!currentUser
      });
      toast.error('Unable to join tribe. Please try again.');
      return;
    }

    setIsJoining(true);

    try {
      await onJoinToggle(localTribe.id);
      toast.success(`Joined ${localTribe.name}!`);
    } catch (error) {
      console.error('Join error:', error);
      toast.error('Failed to join tribe. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };


  const performLeave = async () => {
    if (!localTribe.id || !onJoinToggle) {
      toast.error('Unable to leave tribe. Please try again.');
      return;
    }

    setIsJoining(true);

    try {
      await onJoinToggle(localTribe.id);
      toast.success(`Left ${localTribe.name}`);
    } catch (error) {
      console.error('Leave error:', error);
      toast.error('Failed to leave tribe. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localTribe.id || !onJoinToggle) {
      console.error('Cannot leave tribe: Missing required data');
      toast.error('Unable to leave tribe. Please try again.');
      return;
    }

    if (isOwner) {
      if (localTribe.members.length > 1) {
        toast.error('You must transfer the Chief role before leaving.');
        if (onEdit) onEdit(localTribe);
        return;
      }
      // If they are the only member, allow leaving (which effectively deletes/empties tribe or backend handles it)
      setLeavePrompt('You are the last member. Leaving will close this tribe. Continue?');
      setIsLeaveConfirmOpen(true);
      return;
    } else {
      setLeavePrompt(`Are you sure you want to leave @${localTribe.name}?`);
      setIsLeaveConfirmOpen(true);
      return;
    }
  };


  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(localTribe);
  };

  const handleMembersClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMembersModalOpen(true);
  }

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditDraft({
      name: localTribe.name,
      description: localTribe.description,
      avatarUrl: localTribe.avatarUrl || ''
    });
    onCloseEdit?.();
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localTribe.id) return;
    const trimmedName = editDraft.name.trim();
    if (!trimmedName) {
      toast.error('Tribe name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await api.updateTribe(localTribe.id, {
        name: trimmedName,
        description: editDraft.description.trim(),
        avatarUrl: editDraft.avatarUrl || null
      });
      setLocalTribe(data);
      onSaveEdit?.(data);
      onCloseEdit?.();
      toast.success('Tribe updated.');
    } catch (error) {
      console.error('Update tribe error:', error);
      toast.error('Failed to update tribe.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditDraft(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleReportSubmit = async (payload: { reason: string; details: string }) => {
    if (!localTribe.id) return;
    try {
      await api.reportTribe(localTribe.id, payload.reason, payload.details);
      toast.success('Report submitted. Thank you for keeping Tribe safe.');
      setIsReportOpen(false);
    } catch (error) {
      console.error('Report tribe error:', error);
      toast.error('Failed to submit report.');
    }
  };

  const handleModerationAction = async () => {
    if (!moderationAction || !localTribe.id) return;
    try {
      await api.applyModerationAction({
        targetType: 'tribe',
        targetId: localTribe.id,
        actionType: moderationAction
      });
      const updated = {
        ...localTribe,
        isHidden: moderationAction === 'hide'
      };
      setLocalTribe(updated);
      toast.success(moderationAction === 'hide' ? 'Tribe hidden.' : 'Tribe unhidden.');
      onSaveEdit?.(updated);
    } catch (error) {
      console.error('Moderation action error:', error);
      toast.error('Failed to apply moderation action.');
    }
  };

  return (
    <>
      <Card>
        <MenuButton
          type="button"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
        >
          <MoreVertical size={18} />
        </MenuButton>
        {isMenuOpen && (
          <>
            <MenuOverlay onClick={() => setIsMenuOpen(false)} />
            <Menu role="menu" aria-label="Tribe actions">
              {isOwner && onEdit && (
                <>
                  <MenuItem
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      handleEditClick(event);
                    }}
                    role="menuitem"
                  >
                    <Edit3 size={16} />
                    Edit Tribe
                  </MenuItem>
                  <MenuDivider />
                </>
              )}
              {currentUser && (
                <MenuItem
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsMenuOpen(false);
                    setIsReportOpen(true);
                  }}
                  $tone="warning"
                  role="menuitem"
                >
                  <Flag size={16} />
                  Report Tribe
                </MenuItem>
              )}
              {isAdmin && (
                <>
                  <MenuDivider />
                  <MenuItem
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      setModerationAction(localTribe.isHidden ? 'unhide' : 'hide');
                    }}
                    $tone="warning"
                    role="menuitem"
                  >
                    <EyeOff size={16} />
                    {localTribe.isHidden ? 'Unhide Tribe' : 'Hide Tribe'}
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        )}

        <AvatarCircle>
          {((isEditing && editDraft.avatarUrl) || localTribe.avatarUrl) ? (
            <AvatarImage src={(isEditing ? editDraft.avatarUrl : localTribe.avatarUrl) || ''} alt={localTribe.name} />
          ) : (
            <Users size={32} color="#D6B9A0" /> // Minimalistic group icon, light brown
          )}
          {isEditing && (
            <>
              <AvatarEditButton type="button" onClick={(event) => {
                event.stopPropagation();
                avatarInputRef.current?.click();
              }}>
                <Camera size={16} />
              </AvatarEditButton>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </>
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

        {isEditing ? (
          <InputWrapper style={{ marginBottom: '0.5rem' }}>
            <InlineInput
              value={editDraft.name}
              onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <InputIcon>
              <Edit3 size={16} />
            </InputIcon>
          </InputWrapper>
        ) : (
          <TribeName>{localTribe.name}</TribeName>
        )}
        <MemberCount onClick={handleMembersClick} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {localTribe.members.length} members
        </MemberCount>

        {isEditing ? (
          <InputWrapper>
            <InlineTextArea
              value={editDraft.description}
              onChange={(event) => setEditDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe your tribe"
            />
            <InputIcon>
              <Edit3 size={16} />
            </InputIcon>
          </InputWrapper>
        ) : (
          <Quote>"{localTribe.description}"</Quote>
        )}

        <ButtonGroup>
          {isEditing ? (
            <>
              <Button $variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button $variant="primary" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : isMember ? (
            <>
              <Button $variant="secondary" onClick={(e) => {
                e.stopPropagation();
                navigate(`/tribes/${localTribe.id}`);
              }}>
                Chat
              </Button>
              <Button
                $variant="primary"
                onClick={handleLeave}
                disabled={isJoining}
              >
                {isJoining ? 'Leaving...' : 'Leave'}
              </Button>
            </>
          ) : (
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
        memberIds={localTribe.members}
        userMap={userMap}
        ownerId={localTribe.owner}
        currentUserId={currentUser?.id}
        tribeId={localTribe.id}
        tribeName={localTribe.name}
        onMemberKicked={(memberId) => {
          setLocalTribe(prev => ({
            ...prev,
            members: prev.members.filter(id => id !== memberId),
          }));
        }}
        onViewProfile={(user) => {
          setIsMembersModalOpen(false);
          if (onViewProfile) onViewProfile(user);
        }}
      />
      {isReportOpen && (
        <ReportModal
          targetType="tribe"
          onClose={() => setIsReportOpen(false)}
          onSubmit={handleReportSubmit}
        />
      )}
      <ConfirmationModal
        isOpen={isLeaveConfirmOpen}
        title="Leave Tribe"
        message={leavePrompt}
        confirmText="Leave"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setIsLeaveConfirmOpen(false)}
        onConfirm={performLeave}
      />
      <ConfirmationModal
        isOpen={!!moderationAction}
        title={moderationAction === 'hide' ? 'Hide Tribe' : 'Unhide Tribe'}
        message={moderationAction === 'hide'
          ? 'This will hide the tribe from members until an admin restores it.'
          : 'This will make the tribe visible to members again.'}
        confirmText={moderationAction === 'hide' ? 'Hide' : 'Unhide'}
        cancelText="Cancel"
        variant="danger"
        onClose={() => setModerationAction(null)}
        onConfirm={handleModerationAction}
      />
    </>
  );
};

export default TribeCard;
