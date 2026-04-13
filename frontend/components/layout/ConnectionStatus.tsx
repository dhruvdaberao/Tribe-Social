import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const StatusBanner = styled.div`
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 9999;
  border: 1px solid ${({ theme }) => theme.border};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { transform: translate(-50%, 20px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
`;

const ConnectionStatus: React.FC = () => {
    const { isConnected } = useSocket();
    const { currentUser } = useAuth();
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setShowIndicator(false);
            return;
        }

        if (!isConnected) {
            setShowIndicator(true);
            const timer = setTimeout(() => {
                setShowIndicator(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowIndicator(false);
        }
    }, [isConnected, currentUser]);

    if (!showIndicator) return null;

    return (
        <StatusBanner>
            <div className="w-3 h-3 border-2 border-[#e53e3e] border-t-transparent rounded-full animate-spin"></div>
            <span>Reconnecting...</span>
        </StatusBanner>
    );
};

export default ConnectionStatus;
