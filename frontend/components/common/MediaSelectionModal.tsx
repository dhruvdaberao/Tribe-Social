import React from 'react';
import styled from 'styled-components';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
    font-family: inherit;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const OptionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: ${({ theme }) => theme.background};
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.primary}1A;
    border-color: ${({ theme }) => theme.primary};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  span {
    font-size: 0.95rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.cardBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 4px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
`;

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  anchorEl?: HTMLElement | null;
}

const MediaSelectionModal: React.FC<MediaSelectionModalProps> = ({ isOpen, onClose, onSelectCamera, onSelectGallery }) => {
  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      overlayStyle={{ background: 'rgba(0, 0, 0, 0.5)' }}
      contentStyle={{ width: '100%', maxWidth: '400px' }}
      zIndex={9999}
    >
      <ModalContainer>
        <Header>
          <h3>Add Media</h3>
          <CloseButton onClick={onClose} aria-label="Close add media modal">
            <X size={24} />
          </CloseButton>
        </Header>

        <OptionsGrid>
          <OptionButton onClick={() => { onSelectCamera(); onClose(); }}>
            <IconWrapper>
              <Camera size={24} />
            </IconWrapper>
            <span>Take Photo</span>
          </OptionButton>

          <OptionButton onClick={() => { onSelectGallery(); onClose(); }}>
            <IconWrapper>
              <ImageIcon size={24} />
            </IconWrapper>
            <span>Gallery</span>
          </OptionButton>
        </OptionsGrid>
      </ModalContainer>
    </ModalPortal>
  );
};

export default MediaSelectionModal;
