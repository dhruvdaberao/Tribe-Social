import React from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Users, Shield } from 'lucide-react';

const Card = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CoverImage = styled.div<{ $src?: string | null }>`
  height: 140px;
  background-color: ${({ theme }) => theme.borderColor}; // Fallback grey
  background-image: ${({ $src }) => $src ? `url(${$src})` : 'none'};
  background-size: cover;
  background-position: center;
  position: relative;
`;

const AvatarCircle = styled.div<{ $src?: string | null }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ddd;
  background-image: ${({ $src }) => $src ? `url(${$src})` : 'none'};
  background-size: cover;
  background-position: center;
  border: 4px solid ${({ theme }) => theme.cardBackground};
  position: absolute;
  bottom: -20px;
  left: 20px;
`;

const Content = styled.div`
  padding: 24px 20px 20px; // Extra top padding for avatar overlap
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TribeName = styled.h3`
  margin: 10px 0 8px;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.text};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
  flex: 1;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface TribeCardProps {
    tribe: Tribe;
    currentUser: User | null;
}

const TribeCard: React.FC<TribeCardProps> = ({ tribe, currentUser }) => {
    const navigate = useNavigate();
    const isMember = currentUser && tribe.members.includes(currentUser.id);

    return (
        <Card onClick={() => navigate(`/tribes/${tribe.id}`)}>
            <CoverImage>
                {/* Fallback pattern or color if no cover. For now using avatar as cover bg is common or just a color */}
            </CoverImage>

            <AvatarCircle $src={tribe.avatarUrl || '/default-tribe.png'} />

            <Content>
                <TribeName>{tribe.name}</TribeName>
                <Description>{tribe.description}</Description>

                <Footer>
                    <Stat>
                        <Users size={16} />
                        {tribe.members.length} {tribe.members.length === 1 ? 'Member' : 'Members'}
                    </Stat>
                    {isMember && (
                        <Stat style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                            ✓ Joined
                        </Stat>
                    )}
                </Footer>
            </Content>
        </Card>
    );
};

export default TribeCard;
