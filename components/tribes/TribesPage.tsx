import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import * as api from '../../api';
import TribeCard from './TribeCard';
import CreateTribeModal from './CreateTribeModal';
import EditTribeModal from './EditTribeModal';
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
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
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
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // ───────────── INSTANT CACHE HYDRATION + BACKGROUND REFRESH ─────────────
  useEffect(() => {
    let mounted = true;

    // Load cached tribes instantly (only if they use `id` format)
    const cached = localStorage.getItem('tribe_storage_tribes');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.every(t => t.id)) {
          setTribes(parsed);
          setIsLoading(false);
        }
      } catch { }
    }


    // 2️⃣ Fetch fresh data in background
    const fetchData = async () => {
      try {
        const [tribesRes, usersRes] = await Promise.all([
          api.fetchTribes(),
          api.fetchUsers()
        ]);

        if (!mounted) return;

        setTribes(tribesRes.data);
        setAllUsers(usersRes.data);
        setIsLoading(false);
        setError(null); // 🔥 Fix: Clear error on success

        localStorage.setItem(
          'tribe_storage_tribes',
          JSON.stringify(tribesRes.data)
        );
      } catch (err) {
        console.error(err);
        if (mounted) {
          // Only show error if we have ZERO tribes (otherwise we just failed refresh)
          // But kept simple: just set error text, rendering logic handles visibility
          setError('Failed to load tribes');
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // ───────────── CRUD HANDLERS ─────────────
  const handleTribeCreated = (newTribe: Tribe) => {
    setTribes(prev => {
      const updated = [newTribe, ...prev];
      localStorage.setItem('tribe_storage_tribes', JSON.stringify(updated));
      return updated;
    });
    setIsCreateModalOpen(false);
  };

  const handleTribeUpdated = (updated: Tribe) => {
    setTribes(prev => {
      const updatedList = prev.map(t => t.id === updated.id ? updated : t);
      localStorage.setItem('tribe_storage_tribes', JSON.stringify(updatedList));
      return updatedList;
    });
    setEditingTribe(null);
  };

  const handleTribeDeleted = async (tribeId: string) => {
    await api.deleteTribe(tribeId);
    setTribes(prev => {
      const updated = prev.filter(t => t.id !== tribeId);
      localStorage.setItem('tribe_storage_tribes', JSON.stringify(updated));
      return updated;
    });
    setEditingTribe(null);
  };

  const handleJoinToggle = async (tribeId: string) => {
    console.log('handleJoinToggle called with tribeId:', tribeId);

    try {
      console.log('Calling API to join/leave tribe:', tribeId);
      const { data: updatedTribe } = await api.joinTribe(tribeId);
      console.log('API response - Updated tribe:', updatedTribe);

      setTribes(prev => {
        const updated = prev.map(t => t.id === tribeId ? updatedTribe : t);
        localStorage.setItem('tribe_storage_tribes', JSON.stringify(updated));
        console.log('Updated tribes state with new membership');
        return updated;
      });
    } catch (error) {
      console.error('Failed to join/leave tribe:', error);
      console.error('Error details:', {
        tribeId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

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

      {error && tribes.length === 0 && <LoadingMessage>{error}</LoadingMessage>}

      {isLoading && tribes.length === 0 && (
        <LoadingMessage>
          <img src="/busstop.gif" width={100} />
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
                onEdit={setEditingTribe}
                onJoinToggle={handleJoinToggle}
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
                onJoinToggle={handleJoinToggle}
                unreadCount={unreadTribeCount?.[tribe.id] || 0}
              />
            ))}
          </Grid>
        </>
      )}

      {isCreateModalOpen && (
        <CreateTribeModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleTribeCreated}
        />
      )}

      {editingTribe && (
        <EditTribeModal
          tribe={editingTribe}
          onClose={() => setEditingTribe(null)}
          onSuccess={handleTribeUpdated}
          onDelete={handleTribeDeleted}
        />
      )}
    </Container>
  );
};

export default TribesPage;
