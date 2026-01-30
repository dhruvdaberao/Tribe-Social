import React, { useState, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Camera, Trash2 } from 'lucide-react';
import * as api from '../../api';
import { toast } from '../common/Toast';
import MediaSelectionModal from '../common/MediaSelectionModal';
import { Tribe } from '../../types';

interface EditTribeModalProps {
  tribe: Tribe;
  onClose: () => void;
  onSuccess: (updatedTribe: Tribe) => void;
  onDelete?: (tribeId: string) => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${props => props.theme.cardBackground};
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid ${props => props.theme.border};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    font-family: 'Outfit', sans-serif;
    color: ${props => props.theme.text};
    margin: 0;
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
  gap: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Outfit', sans-serif;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const Button = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

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
  padding: 10px;
  margin-top: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
  }
`;

const EditTribeModal: React.FC<EditTribeModalProps> = ({ tribe, onClose, onSuccess, onDelete }) => {
  const [description, setDescription] = useState(tribe.description);
  const [avatarUrl, setAvatarUrl] = useState(tribe.avatarUrl || ''); // Use avatarUrl property
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setIsMediaModalOpen(false); // Close modal after selection
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updatedData = {
        description,
        avatarUrl
      };

      const updatedTribe = await api.updateTribe(tribe.id, updatedData);
      onSuccess(updatedTribe.data);
      onClose();
      toast.success('Tribe updated successfully');
    } catch (err) {
      console.error('Failed to update tribe:', err);
      setError('Failed to update tribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tribe? This action cannot be undone.')) {
      if (onDelete) {
        onDelete(tribe.id);
      }
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <h2>Edit Tribe</h2>
          <CloseButton onClick={onClose}><X size={24} /></CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setIsMediaModalOpen(true)}
            >
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center / cover` : theme.secondary,
                border: `2px dashed ${theme.textSecondary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {!avatarUrl && <Camera size={40} color={theme.cardBackground} strokeWidth={1.5} />}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                background: theme.primary, borderRadius: '50%',
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 18, border: `1px solid ${theme.primary}`
              }}>+</div>
            </div>
          </div>
          <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />

          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </Form>

        {onDelete && (
          <DeleteButton type="button" onClick={handleDelete}>
            <Trash2 size={18} /> Delete Tribe
          </DeleteButton>
        )}
      </Modal>

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectGallery={() => fileInputRef.current?.click()}
      />
    </Overlay>
  );
};

export default EditTribeModal;