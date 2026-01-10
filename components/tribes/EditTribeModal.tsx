import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
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
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  padding: 24px;
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
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
  min-height: 100px;
`;

const Button = styled.button`
  background: #FF5722;
  color: white;
  padding: 14px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  &:disabled { opacity: 0.7; }
`;

interface EditTribeModalProps {
    tribe: Tribe;
    onClose: () => void;
    onSuccess: (updatedTribe: Tribe) => void;
}

const EditTribeModal: React.FC<EditTribeModalProps> = ({ tribe, onClose, onSuccess }) => {
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

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    <h2>Edit Tribe</h2>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><X size={24} /></button>
                </Header>
                <Form onSubmit={handleSubmit}>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tribe Name" required />
                    <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
                    <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL" />
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </Form>
            </Modal>
        </Overlay>
    );
};

export default EditTribeModal;