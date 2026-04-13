import React, { useState, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Camera, Lock } from 'lucide-react';
import * as api from '../../api';
import { toast } from '../common/Toast';
import MediaSelectionModal from '../common/MediaSelectionModal';
import ModalPortal from '../common/ModalPortal';


const Modal = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  padding: 0.875rem;
  position: relative;
  box-shadow: 0 8px 20px rgba(0,0,0,0.24);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: ${({ theme }) => theme.text}; }
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
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
  &::placeholder { color: ${({ theme }) => theme.textSecondary}; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 62px;
  max-height: 80px;
  resize: none;
  font-size: 0.875rem;
  line-height: 1.35;
  text-align-vertical: top;
  
  &:focus { outline: 2px solid ${({ theme }) => theme.primary}; border-color: transparent; }
  &::placeholder { color: ${({ theme }) => theme.textSecondary}; }
`;

const Button = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  padding: 11px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 6px;
  
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
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await api.createTribe({
        name: name.trim(),
        description: description.trim(),
        avatarUrl,
        memberLimit,
        isPrivate,
        vibe
      });
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => setIsMediaModalOpen(true)}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : theme.secondary,
                border: `2px dashed ${theme.textSecondary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {!avatarUrl && <Camera size={20} color={theme.cardBackground} strokeWidth={1.5} />}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                background: theme.primary, borderRadius: '50%',
                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, border: `1px solid ${theme.primary}`
              }}>+</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 6, color: theme.textSecondary, fontSize: '0.75rem' }}>
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
            <Input as="select" value={vibe} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVibe(e.target.value)} style={{ cursor: 'pointer' }}>
              {['General', 'Educational', 'Art', 'Music', 'Anime', 'Pop Culture', 'Tech', 'Gaming', 'Fitness', 'Sports', 'Travel', 'Food', 'Photography', 'Memes', 'Others'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Input>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: theme.text, fontSize: '0.875rem', fontWeight: 500 }}>
              <div
                onClick={() => setIsPrivate(!isPrivate)}
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
            {isPrivate && <span style={{ fontSize: '0.72rem', color: theme.textSecondary }}>Members must request to join</span>}
          </div>

          <Button type="submit" disabled={isSubmitting || isReadingImage}>
            {isReadingImage ? 'Processing image...' : isSubmitting ? 'Creating...' : 'Create Tribe'}
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
