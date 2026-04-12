import React, { useState, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Camera } from 'lucide-react';
import * as api from '../../api';
import { toast } from '../common/Toast';
import MediaSelectionModal from '../common/MediaSelectionModal';
import ModalPortal from '../common/ModalPortal';


const Modal = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
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
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
  &::placeholder { color: ${({ theme }) => theme.textSecondary}; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100px;
  resize: vertical;
  font-size: 1rem;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
  &::placeholder { color: ${({ theme }) => theme.textSecondary}; }
`;

const Button = styled.button`
  background: ${({ theme }) => theme.primary};
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
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberLimit, setMemberLimit] = useState(50);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [vibe, setVibe] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await api.createTribe({ name, description, avatarUrl, memberLimit, isPrivate, vibe });
      toast.success("Tribe created successfully");
      onSuccess(data);
    } catch (err: any) {
      console.error("Create tribe failed", err);
      toast.error(err.response?.data?.message || "Failed to create tribe");
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear value to allow re-selecting same file
      e.target.value = '';
    }
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose} overlayStyle={{ background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
      <Modal>
        <Header>
          <h2>Create New Tribe</h2>
          <CloseButton onClick={onClose}><X size={24} /></CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

          {/* Visualization inputs */}
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

          {/* Visual Avatar Picker */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setIsMediaModalOpen(true)}
            >
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : theme.secondary,
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
          <div style={{ textAlign: 'center', marginBottom: 20, color: theme.textSecondary, fontSize: '0.9rem' }}>
            Tap to upload image
          </div>

          <div>
            <Label>Tribe Name</Label>
            <Input
              placeholder="e.g. Kasukabe Defence Group"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <TextArea
              placeholder="Kasubake Defense Force, fire!"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Vibe of the Tribe</Label>
            <Input as="select" value={vibe} onChange={(e: any) => setVibe(e.target.value)} style={{ cursor: 'pointer' }}>
              {['General', 'Educational', 'Art', 'Music', 'Anime', 'Pop Culture', 'Tech', 'Gaming', 'Fitness', 'Sports', 'Travel', 'Food', 'Photography', 'Memes', 'Others'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Input>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: theme.text, fontSize: '0.95rem', fontWeight: 500 }}>
              <div
                onClick={() => setIsPrivate(!isPrivate)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: isPrivate ? theme.primary : theme.border,
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', position: 'absolute', top: 2,
                  left: isPrivate ? 22 : 2, transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              Private Tribe {isPrivate ? '🔒' : ''}
            </label>
            {isPrivate && <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Members must request to join</span>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Tribe'}
          </Button>
        </Form>
      </Modal>

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectGallery={() => fileInputRef.current?.click()}
      />
    </ModalPortal>
  );
};

export default CreateTribeModal;
