import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import * as api from '../../api';
import TribeCard from './TribeCard';
import CreateTribeModal from './CreateTribeModal';
import EditTribeModal from './EditTribeModal';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Styled Components (Clean, Modern, Robust)
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
  background-color: ${({ theme }) => theme.primary}; // Use theme color (Brown/Beige)
  color: ${({ theme }) => theme.cardBackground}; // Contrast text
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  gap: 16px;
  
  img {
      width: 100px;
      height: 100px;
      object-fit: contain;
  }

  p {
    color: ${({ theme }) => theme.textSecondary};
    font-size: 1.1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 12px;
  color: ${({ theme }) => theme.textSecondary};
  
  h3 {
    margin-bottom: 12px;
    font-size: 1.5rem;
    color: ${({ theme }) => theme.text};
  }
`;

// Interface for Props
interface TribesPageProps {
    currentUser: User | null;
    isLoadingProp?: boolean; // Optional override from App.tsx
}

const TribesPage: React.FC<TribesPageProps> = ({ currentUser, isLoadingProp }) => {
    // Local state for reliability - don't depend solely on App.tsx state
    const [tribes, setTribes] = useState<Tribe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // FETCH TRIBES & USERS ON MOUNT
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // Check cache first for instant render
                const cachedTribes = localStorage.getItem('tribe_storage_tribes');

                // Show cached immediately if available
                if (cachedTribes) {
                    const parsed = JSON.parse(cachedTribes);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setTribes(parsed);
                        // Delay loading false just a bit so we don't flash if re-fetching
                    }
                }

                console.log("🔍 TribesPage: Fetching data from API...");
                const [tribesRes, usersRes] = await Promise.all([
                    api.fetchTribes(),
                    api.fetchUsers()
                ]);

                if (isMounted) {
                    setTribes(tribesRes.data);
                    // We need to store users in a map or context, but for now passing them down 
                    // via props or a local efficient lookup would be best. 
                    // However, TribesPage doesn't have a userMap prop. 
                    // We will just store the users locally in state to pass to TribeCard (via modal).
                    // Actually, wait, `TribeCard` just needs to show the modal with `userMap`.
                    // We'll add `allUsers` to state.
                    setAllUsers(usersRes.data);

                    setIsLoading(false);
                    // Update cache
                    localStorage.setItem('tribe_storage_tribes', JSON.stringify(tribesRes.data));
                }
            } catch (err) {
                console.error("❌ TribesPage: Failed to load data", err);
                if (isMounted) {
                    setError("Failed to load community data.");
                    setIsLoading(false);
                }
            }
        };

        // Minimum 2 second loading timer as requested by user for "feature"
        const timer = setTimeout(() => {
            loadData();
        }, 2000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleTribeCreated = (newTribe: Tribe) => {
        setTribes(prev => [newTribe, ...prev]);
        setIsCreateModalOpen(false);
    };

    const handleTribeUpdated = (updatedTribe: Tribe) => {
        setTribes(prev => prev.map(t => t._id === updatedTribe._id ? updatedTribe : t));
        setEditingTribe(null);
    };

    const handleTribeDeleted = async (tribeId: string) => {
        try {
            await api.deleteTribe(tribeId);
            setTribes(prev => prev.filter(t => t._id !== tribeId));
            setEditingTribe(null);
        } catch (error) {
            console.error("Failed to delete tribe", error);
        }
    };

    // Filter Tribes
    const myTribes = tribes.filter(t =>
        currentUser && (t.owner === currentUser.id || t.members.includes(currentUser.id))
    );
    const discoverTribes = tribes.filter(t =>
        !currentUser || (t.owner !== currentUser.id && !t.members.includes(currentUser.id))
    );

    // RENDER LOGIC
    return (
        <Container>
            <Header>
                <Title>Tribes</Title>
                <CreateButton onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={20} />
                    Create Tribe
                </CreateButton>
            </Header>

            {/* ERROR STATE */}
            {error && (
                <LoadingMessage style={{ color: 'red' }}>
                    {error} <br />
                    <button onClick={() => window.location.reload()} style={{ marginTop: 10, padding: '5px 10px' }}>Retry</button>
                </LoadingMessage>
            )}

            {/* LOADING STATE - Only show if NO tribes are visible (i.e. empty cache) */}
            {isLoading && tribes.length === 0 && (
                <LoadingMessage>
                    <img src="/busstop.gif" alt="Loading..." style={{ borderRadius: '50%', width: 100, height: 100, objectFit: 'cover' }} />
                    <p>Summoning the Tribes...</p>
                </LoadingMessage>
            )}

            {/* CONTENT */}
            {!isLoading && !error && (
                <>
                    {/* CASE 1: NO TRIBES AT ALL */}
                    {tribes.length === 0 && (
                        <EmptyState>
                            <h3>No Tribes Found</h3>
                            <p>Be the first to start a community!</p>
                        </EmptyState>
                    )}

                    {/* CASE 2: HAS TRIBES */}
                    {tribes.length > 0 && (
                        <>
                            {/* SECTION: YOUR TRIBES */}
                            {myTribes.length > 0 && (
                                <div style={{ marginBottom: 40 }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Your Tribes</h2>
                                    <Grid>
                                        {myTribes.map(tribe => (
                                            <TribeCard
                                                key={tribe._id}
                                                tribe={tribe}
                                                currentUser={currentUser}
                                                allUsers={allUsers}
                                                onEdit={(t) => setEditingTribe(t)}
                                            />
                                        ))}
                                    </Grid>
                                </div>
                            )}

                            {/* SECTION: EXPLORE TRIBES */}
                            {discoverTribes.length > 0 && (
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Explore Tribes</h2>
                                    <Grid>
                                        {discoverTribes.map(tribe => (
                                            <TribeCard
                                                key={tribe._id}
                                                tribe={tribe}
                                                currentUser={currentUser}
                                                allUsers={allUsers}
                                            />
                                        ))}
                                    </Grid>
                                </div>
                            )}

                            {/* CASE: HAS TRIBES BUT NONE TO EXPLORE */}
                            {discoverTribes.length === 0 && myTribes.length > 0 && (
                                <div style={{ marginTop: 40, textAlign: 'center', color: '#888' }}>
                                    <p>You've joined all available tribes! Create a new one?</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* MODALS */}
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
