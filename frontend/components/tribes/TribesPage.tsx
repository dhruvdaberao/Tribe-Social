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
  const [searchQuery, setSearchQuery] = useState('');

  // Lazy Fetch on Mount
  useEffect(() => {
    fetchTribes().finally(() => setIsLoading(false));
  }, [fetchTribes]);

  // ───────────── FILTERING ─────────────
  const lowerQuery = searchQuery.toLowerCase();
  const searchFilter = (t: import('../../types').Tribe) => 
    t.name.toLowerCase().includes(lowerQuery) || 
    (t.description?.toLowerCase().includes(lowerQuery) ?? false);

  const myTribes = tribes.filter(
    t => currentUser && (t.owner === currentUser.id || t.members.includes(currentUser.id))
  ).filter(searchFilter);

  const discoverTribes = tribes.filter(
    t => !currentUser || (!t.members.includes(currentUser.id) && t.owner !== currentUser.id)
  ).filter(searchFilter);

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

      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tribes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow shadow-sm"
          />
        </div>
      </div>

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
