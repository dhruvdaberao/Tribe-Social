import React from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import { useNavigate } from 'react-router-dom';

const Card = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 1rem; // 16px (Spec)
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); // Consider updating to spec shadow later if provided
  transition: transform 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem; // 24px (Spec Global Padding)
  text-align: center;
  border: 1px solid ${({ theme }) => theme.border};

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.primary};
  }
`;

const AvatarCircle = styled.div<{ $src?: string | null }>`
  width: 5rem; // 80px (Spec)
  height: 5rem; // 80px (Spec)
  border-radius: 50%;
  background-color: ${({ theme }) => theme.secondary};
  background-image: ${({ $src }) => $src ? `url(${$src})` : 'none'};
  background-size: cover;
  background-position: center;
  margin-bottom: 1rem;
  border: 4px solid ${({ theme }) => theme.background};
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
`;

const TribeName = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const MemberCount = styled.p`
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Quote = styled.p`
  color: ${({ theme }) => theme.text};
  font-style: italic;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
  line-height: 1.4;
  padding: 0 0.5rem; // Horizontal padding 8px (Spec)
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: auto;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  height: 2.5rem; // 40px (Spec)
  padding: 0 1rem; // Vertical center, horizontal 1rem
  border-radius: 0.75rem; // 12px (Spec Inner Component)
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $variant, theme }) => $variant === 'primary' ? `
    background: ${theme.primary};
    color: #FFFFFF; // Accent Text (Spec)
    border: none;
  ` : `
    background: transparent;
    border: 1px solid ${theme.textSecondary};
    color: ${theme.text};
  `}

  &:hover {
    opacity: 0.9;
    background: ${({ $variant, theme }) => $variant === 'primary' ? theme.hover : 'transparent'};
  }
`;

interface TribeCardProps {
  tribe: Tribe;
  currentUser: User | null;
}

const TribeCard: React.FC<TribeCardProps> = ({ tribe, currentUser }) => {
  const navigate = useNavigate();
  const isMember = currentUser && tribe.members.includes(currentUser.id);

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Determine action based on membership (placeholder for now, action handled in Detail Page usually)
    navigate(`/tribes/${tribe.id}`);
  };

  return (
    <Card onClick={() => navigate(`/tribes/${tribe.id}`)}>
      <AvatarCircle $src={tribe.avatarUrl || '/default-tribe.png'} />

      <TribeName>{tribe.name}</TribeName>
      <MemberCount>{tribe.members.length} members</MemberCount>

      <Quote>"{tribe.description}"</Quote>

      <ButtonGroup>
        <Button $variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/tribes/${tribe.id}`); }}>
          Chat
        </Button>
        <Button $variant="primary" onClick={handleJoin}>
          {isMember ? 'Joined' : 'Join'}
        </Button>
      </ButtonGroup>
    </Card>
  );
};

export default TribeCard;
