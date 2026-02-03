import React from 'react';
import styled from 'styled-components';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5); // consistent with other modals
  display: flex;
  align-items: flex-end; // Bottom sheet style for mobile feel, can be center for desktop
  justify-content: center;
  z-index: 2000; // Higher than standard modals
  padding: 1rem;

  @media (min-width: 640px) {
    align-items: center;
  }
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.3s ease-out;

  @media (min-width: 640px) {
    border-radius: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

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
    font-family: inherit; // Use global font
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
  border: 1px solid ${({ theme }) => theme.borderColor};
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
`; // Neutral distinctive bg
// Or check theme usage:
// theme.surface might not exist in that strict theme file I saw.
// Let's use theme.background for button, and theme.cardBackground for modal.
// IconWrapper needs to contrast against theme.background.
// Let's use theme.cardBackground if button is theme.background.

// Re-defining IconWrapper safely based on likely available theme keys (background/cardBackground/primary)
// theme.surface was used in CreatePost but I saw lightTheme keys: background, cardBackground, border.
// I will use theme.cardBackground for button background? No, button is background effectively.
// Let's stick to safe keys.

// Redoing Styled Components with safe keys from theme.ts

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

const MediaSelectionModal: React.FC<MediaSelectionModalProps> = ({ isOpen, onClose, onSelectCamera, onSelectGallery }) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <h3>Add Media</h3>
          <CloseButton onClick={onClose}>
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
    </Overlay>
  );
};

export default MediaSelectionModal;
