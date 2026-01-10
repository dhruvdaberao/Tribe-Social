import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import * as api from '../../api';

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
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 { margin: 0; font-size: 1.5rem; color: ${({ theme }) => theme.text}; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  &:hover { color: ${({ theme }) => theme.text}; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
  
  &:focus { outline: 2px solid #FF5722; border-color: transparent; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
  min-height: 100px;
  resize: vertical;
  
  &:focus { outline: 2px solid #FF5722; border-color: transparent; }
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
  
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

interface CreateTribeModalProps {
    onClose: () => void;
    onSuccess: (newTribe: any) => void;
}

const CreateTribeModal: React.FC<CreateTribeModalProps> = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { data } = await api.createTribe({ name, description, avatarUrl });
            onSuccess(data);
        } catch (err: any) {
            console.error("Create tribe failed", err);
            setError(err.response?.data?.message || "Failed to create tribe");
            setIsSubmitting(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    <h2>Create New Tribe</h2>
                    <CloseButton onClick={onClose}><X size={24} /></CloseButton>
                </Header>

                <Form onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

                    <div>
                        <Label>Tribe Name</Label>
                        <Input
                            placeholder="e.g. Developers, Artists..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <TextArea
                            placeholder="What is this community about?"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Avatar Image URL (Optional)</Label>
                        <Input
                            placeholder="https://..."
                            value={avatarUrl}
                            onChange={e => setAvatarUrl(e.target.value)}
                        />
                        <small style={{ color: '#888', marginTop: 4, display: 'block' }}>Supported: Imgur, Cloudinary links</small>
                    </div>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Tribe'}
                    </Button>
                </Form>
            </Modal>
        </Overlay>
    );
};

export default CreateTribeModal;