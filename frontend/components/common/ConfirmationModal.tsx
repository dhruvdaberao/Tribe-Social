import React from 'react';
import styled from 'styled-components';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
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
  padding: 1rem;
`;

const Modal = styled.div`
  background: ${props => props.theme.cardBackground};
  padding: 1.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  border: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: ${props => props.theme.text};
    font-family: 'Outfit', sans-serif;
  }
`;

const Message = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'danger' | 'primary' | 'secondary' }>`
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  border: none;
  font-size: 0.9rem;

  ${props => props.variant === 'secondary' && `
    background: transparent;
    border: 1px solid ${props.theme.border};
    color: ${props.theme.text};
    &:hover { background: ${props.theme.background}; }
  `}

  ${props => props.variant === 'danger' && `
    background: #ef4444;
    color: white;
    &:hover { opacity: 0.9; }
  `}

  ${props => props.variant === 'primary' && `
    background: ${props.theme.primary};
    color: white;
    &:hover { opacity: 0.9; }
  `}
`;

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    {variant === 'danger' && <AlertTriangle size={24} color="#ef4444" />}
                    <h3>{title}</h3>
                </Header>
                <Message>{message}</Message>
                <ButtonGroup>
                    <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
                    <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
                </ButtonGroup>
            </Modal>
        </Overlay>
    );
};

export default ConfirmationModal;
