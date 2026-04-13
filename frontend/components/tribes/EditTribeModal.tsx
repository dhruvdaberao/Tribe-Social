import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Camera, Trash2, Lock, ChevronDown } from 'lucide-react';
import * as api from '../../api';
import { toast } from '../common/Toast';
import MediaSelectionModal from '../common/MediaSelectionModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ModalPortal from '../common/ModalPortal';
import { Tribe } from '../../types';

interface EditTribeModalProps {
  tribe: Tribe;
  onClose: () => void;
  onSuccess: (updatedTribe: Tribe) => void;
  onDelete?: (tribeId: string) => void;
  allUsers: import('../../types').User[];
  variant?: 'modal' | 'inline';
  onManageMembers?: () => void;
}



const Modal = styled.div`
  background: ${props => props.theme.cardBackground};
  padding: 1.5rem; // Reduced padding
  border-radius: 12px;
  width: 90%;
  max-width: 450px; // Slightly smaller max-width
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
`;

const InlineWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
`;

const InlineModal = styled(Modal)`
  width: 100%;
  max-width: none;
  max-height: none;
  padding: 1.25rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem; // Reduced margin
  
  h2 {
    font-family: 'Outfit', sans-serif;
    color: ${props => props.theme.text};
    margin: 0;
    font-size: 1.25rem; // Smaller header
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.textSecondary};
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem; // Reduced gap
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Outfit', sans-serif;
  resize: none;
  min-height: 84px;
  max-height: 104px;
  font-size: 0.9rem; // Smaller font
  line-height: 1.35;
  text-align-vertical: top;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Outfit', sans-serif;
  outline: none;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Outfit', sans-serif;
  outline: none;
  font-size: 0.9rem;
`;

const Button = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 0.875rem; // Reduced padding
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  transition: opacity 0.2s;
  margin-top: 1.5rem; // Increased spacing for clear separation

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #ef4444; 
  cursor: pointer;
  padding: 8px;
  margin-top: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
  }
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 2px;
`;

const VIBE_OPTIONS = ['General', 'Educational', 'Art', 'Music', 'Anime', 'Pop Culture', 'Tech', 'Gaming', 'Fitness', 'Sports', 'Travel', 'Food', 'Photography', 'Memes', 'Others'];

const CustomSelectWrapper = styled.div`
  position: relative;
`;

const CustomSelectTrigger = styled.button`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const CustomSelectDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 180px;
  overflow-y: auto;
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 100;
  padding: 4px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
`;

const CustomSelectOption = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: ${({ $selected }) => $selected ? 'rgba(214, 185, 160, 0.18)' : 'transparent'};
  color: ${({ $selected, theme }) => $selected ? theme.primary : theme.text};
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme.hover || 'rgba(214, 185, 160, 0.12)'};
  }
`;

const EditTribeModal: React.FC<EditTribeModalProps> = ({ tribe, onClose, onSuccess, onDelete, allUsers, variant = 'modal', onManageMembers }) => {
  const [name, setName] = useState(tribe.name);
  const [description, setDescription] = useState(tribe.description);
  const [avatarUrl, setAvatarUrl] = useState(tribe.avatarUrl || '');
  const [ownerId, setOwnerId] = useState(tribe.owner);
  const [memberLimit, setMemberLimit] = useState<number>(tribe.memberLimit || 50);
  const [isPrivate, setIsPrivate] = useState(tribe.isPrivate || false);
  const [vibe, setVibe] = useState(tribe.vibe || 'General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [error, setError] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'delete' as 'delete' | 'transfer' });
  const [isVibeDropdownOpen, setIsVibeDropdownOpen] = useState(false);

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const members = React.useMemo(() => {
    return allUsers.filter(u => tribe.members.includes(u.id));
  }, [allUsers, tribe.members]);

  useEffect(() => {
    setName(tribe.name);
    setDescription(tribe.description);
    setAvatarUrl(tribe.avatarUrl || '');
    setOwnerId(tribe.owner);
    setMemberLimit(tribe.memberLimit || 50);
    setIsPrivate(Boolean(tribe.isPrivate));
    setVibe(tribe.vibe || 'General');
    setError('');
  }, [tribe]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setIsReadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setIsMediaModalOpen(false);
        setIsReadingImage(false);
      };
      reader.onerror = () => {
        setIsReadingImage(false);
        toast.error('Unable to read selected image.');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerId !== tribe.owner) {
      setConfirmModal({ isOpen: true, type: 'transfer' });
    } else {
      performSave();
    }
  };

  const performSave = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const updatedData: any = {
        name: name.trim(),
        description: description.trim(),
        avatarUrl,
        memberLimit,
        isPrivate,
        vibe,
      };
      if (ownerId !== tribe.owner) updatedData.owner = ownerId;

      const updatedTribe = await api.updateTribe(tribe.id, updatedData);
      onSuccess(updatedTribe.data);
      onClose();
      toast.success('Tribe updated successfully');
    } catch (err: any) {
      console.error('Failed to update tribe:', err);
      setError(err.response?.data?.message || 'Failed to update tribe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmModal({ isOpen: true, type: 'delete' });
  };

  const performDelete = () => {
    if (onDelete) onDelete(tribe.id);
  };

  const Panel = variant === 'inline' ? InlineModal : Modal;
  const panelProps = variant === 'inline' ? {} : { onClick: (event: React.MouseEvent) => event.stopPropagation() };

  const modalContent = (
    <Panel {...panelProps}>
      <Header>
        <h2>Edit Tribe</h2>
        <CloseButton onClick={onClose}><X size={24} /></CloseButton>
      </Header>

      <Form onSubmit={handleSaveClick}>
        {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setIsMediaModalOpen(true)}
          >
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              background: avatarUrl ? `url(${avatarUrl}) center / cover` : theme.secondary,
              border: `2px dashed ${theme.textSecondary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {!avatarUrl && <Camera size={28} color={theme.cardBackground} strokeWidth={1.5} />}
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              background: theme.primary, borderRadius: '50%',
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${theme.cardBackground}`,
            }}>
              <Camera size={12} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label>Tribe Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tribe Name"
            required
          />
        </div>

        <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label>Chief</Label>
          <Select
            value={String(ownerId)}
            onChange={e => setOwnerId(e.target.value)}
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} (@{member.username}) {member.id === tribe.owner ? '(Current)' : ''}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label>Vibe of the Tribe</Label>
          <CustomSelectWrapper>
            <CustomSelectTrigger type="button" onClick={() => setIsVibeDropdownOpen(prev => !prev)}>
              <span>{vibe}</span>
              <ChevronDown size={16} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: isVibeDropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </CustomSelectTrigger>
            {isVibeDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsVibeDropdownOpen(false)} />
                <CustomSelectDropdown>
                  {VIBE_OPTIONS.map(v => (
                    <CustomSelectOption
                      key={v}
                      type="button"
                      $selected={vibe === v}
                      onClick={() => {
                        setVibe(v);
                        setIsVibeDropdownOpen(false);
                      }}
                    >
                      {v}
                    </CustomSelectOption>
                  ))}
                </CustomSelectDropdown>
              </>
            )}
          </CustomSelectWrapper>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: theme.text, fontSize: '0.9rem', fontWeight: 500 }}>
            <div
              onClick={() => setIsPrivate(!isPrivate)}
              role="switch"
              aria-checked={isPrivate}
              style={{
                width: 44, height: 24, borderRadius: 999,
                background: isPrivate ? theme.primary : theme.border,
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'white', position: 'absolute', top: 3,
                left: isPrivate ? 23 : 3, transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Private Tribe {isPrivate && <Lock size={13} color={theme.primary} />}
            </span>
          </label>
        </div>

        <Button type="submit" disabled={isSubmitting || isReadingImage}>
          {isReadingImage ? 'Processing image...' : isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </Form>

      {onDelete && (
        <DeleteButton type="button" onClick={handleDeleteClick}>
          <Trash2 size={16} /> Delete Tribe
        </DeleteButton>
      )}
    </Panel>
  );

  return (
    <>
      {/* Hidden file inputs live outside any portal so refs are always accessible */}
      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />

      {variant === 'inline' ? (
        <InlineWrapper>
          {modalContent}
        </InlineWrapper>
      ) : (
        <ModalPortal isOpen={true} onClose={onClose} overlayStyle={{ background: 'rgba(0, 0, 0, 0.7)', zIndex: 1000 }}>
          {modalContent}
        </ModalPortal>
      )}

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectCamera={() => { cameraInputRef.current?.click(); }}
        onSelectGallery={() => { fileInputRef.current?.click(); }}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.type === 'delete' ? performDelete : performSave}
        title={confirmModal.type === 'delete' ? 'Delete Tribe?' : 'Transfer Ownership?'}
        message={confirmModal.type === 'delete'
          ? "Are you sure you want to delete this tribe? This action cannot be undone."
          : "You are about to transfer the Chief role. You will no longer be Chief of this tribe. Are you sure?"}
        confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Transfer'}
        variant={confirmModal.type === 'delete' ? 'danger' : 'primary'}
      />
    </>
  );
};

export default EditTribeModal;
