import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { User } from '../../types';
import { useGlobalContent } from '../../contexts/GlobalContentContext';
import TribeCard from './TribeCard';
import CreateTribeModal from './CreateTribeModal';
import { Plus } from 'lucide-react';

// ───────────────────────── STYLES ─────────────────────────
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  font-family: var(--font-display);
  color: ${({ theme }) => theme.text};
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.cardBackground};
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  justify-content: center; /* 🔥 Fix: Center items if they don't fill row */
`;

const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 12px;
`;

// ───────────────────────── COMPONENT ─────────────────────────
interface TribesPageProps {
  currentUser: User | null;
  unreadTribeCount?: { [tribeId: string]: number };
}

const TribesPage: React.FC<TribesPageProps> = ({ currentUser, unreadTribeCount }) => {
  const {
    tribes,
    visibleUsers: allUsers,
    fetchTribes,
    handleDeleteTribe,
    handleJoinToggle
  } = useGlobalContent();

  const [isLoading, setIsLoading] = useState(tribes.length === 0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTribeId, setEditingTribeId] = useState<string | null>(null);

  // Lazy Fetch on Mount
  useEffect(() => {
    fetchTribes().finally(() => setIsLoading(false));
  }, [fetchTribes]);

  // ───────────── FILTERING ─────────────
  const myTribes = tribes.filter(
    t => currentUser && (t.owner === currentUser.id || t.members.includes(currentUser.id))
  );

  const discoverTribes = tribes.filter(
    t => !currentUser || (!t.members.includes(currentUser.id) && t.owner !== currentUser.id)
  );

  // ───────────── RENDER ─────────────
  return (
    <Container>
      <Header>
        <Title>Tribes</Title>
        <CreateButton onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} />
          Create Tribe
        </CreateButton>
      </Header>

      {isLoading && tribes.length === 0 && (
        <LoadingMessage>
          <img src="/busstop.gif" width={100} alt="Loading..." />
          <p>Loading tribes…</p>
        </LoadingMessage>
      )}

      {!isLoading && tribes.length === 0 && (
        <EmptyState>
          <h3>No Tribes Yet</h3>
          <p>Create the first one!</p>
        </EmptyState>
      )}

      {myTribes.length > 0 && (
        <>
          <h2>Your Tribes</h2>
          <Grid>
            {myTribes.map(tribe => (
              <TribeCard
                key={tribe.id}
                tribe={tribe}
                currentUser={currentUser}
                allUsers={allUsers}
                onEdit={(selectedTribe) => setEditingTribeId(selectedTribe.id)}
                isEditing={editingTribeId === tribe.id}
                onCloseEdit={() => setEditingTribeId(null)}
                onSaveEdit={(_updatedTribe) => {
                  fetchTribes();
                  setEditingTribeId(null);
                }}
                onDeleteEdit={() => handleDeleteTribe(tribe.id)}
                onJoinToggle={(id) => handleJoinToggle(id)}
                unreadCount={unreadTribeCount?.[tribe.id] || 0}
              />
            ))}
          </Grid>
        </>
      )}

      {discoverTribes.length > 0 && (
        <>
          <h2 style={{ marginTop: 40 }}>Explore Tribes</h2>
          <Grid>
            {discoverTribes.map(tribe => (
              <TribeCard
                key={tribe.id}
                tribe={tribe}
                currentUser={currentUser}
                allUsers={allUsers}
                onEdit={(selectedTribe) => setEditingTribeId(selectedTribe.id)}
                isEditing={editingTribeId === tribe.id}
                onCloseEdit={() => setEditingTribeId(null)}
                onSaveEdit={(_updatedTribe) => {
                  fetchTribes();
                  setEditingTribeId(null);
                }}
                onDeleteEdit={() => handleDeleteTribe(tribe.id)}
                onJoinToggle={(id) => handleJoinToggle(id)}
                unreadCount={unreadTribeCount?.[tribe.id] || 0}
              />
            ))}
          </Grid>
        </>
      )}

      {isCreateModalOpen && (
        <CreateTribeModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchTribes();
            setIsCreateModalOpen(false);
          }}
        />
      )}

    </Container>
  );
};

export default TribesPage;
