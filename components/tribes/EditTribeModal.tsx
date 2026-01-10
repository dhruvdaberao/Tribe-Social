import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Trash2 } from 'lucide-react'; // Import Trash2
import * as api from '../../api';
import { Tribe } from '../../types';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.cardBackground}; // #3B302B
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 1.5rem; color: ${({ theme }) => theme.text}; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor}; // #504540
  background: ${({ theme }) => theme.background}; // #2A2320
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
`;

const Button = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white; // Contrast check: White on Brown is good.
  padding: 14px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  
  &:disabled { opacity: 0.7; }
`;

const DeleteButton = styled.button`
  background: transparent;
  color: #ff6b6b; // Red/Pinkish for error/danger
  border: 1px solid #ff6b6b;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%; // Full width
  
  &:hover { background: rgba(255, 107, 107, 0.1); }
`;

interface EditTribeModalProps {
  tribe: Tribe;
  onClose: () => void;
  onSuccess: (updatedTribe: Tribe) => void;
  onDelete?: (tribeId: string) => void; // Optional delete handler
}

const EditTribeModal: React.FC<EditTribeModalProps> = ({ tribe, onClose, onSuccess, onDelete }) => {
  const [name, setName] = useState(tribe.name);
  const [description, setDescription] = useState(tribe.description);
  const [avatarUrl, setAvatarUrl] = useState(tribe.avatarUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.updateTribe(tribe.id, { name, description, avatarUrl });
      onSuccess(data);
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update tribe");
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this tribe? This cannot be undone.")) {
      if (onDelete) onDelete(tribe.id);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <h2>Edit Tribe</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={onClose}><X size={24} /></button>
        </Header>
        <Form onSubmit={handleSubmit}>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tribe Name" required />
          <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
          <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL" />

          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </Form>

        {onDelete && (
          <DeleteButton type="button" onClick={handleDelete}>
            <Trash2 size={18} /> Delete Tribe
          </DeleteButton>
        )}
      </Modal>
    </Overlay>
  );
};

export default EditTribeModal;