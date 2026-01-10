import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Tribe, User } from '../../types';
import * as api from '../../api';
import TribeCard from './TribeCard';
import CreateTribeModal from './CreateTribeModal';
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
  background-color: #FF5722; // Brand Orange
  color: white;
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
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 1.1rem;
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

    // FETCH TRIBES ON MOUNT
    useEffect(() => {
        let isMounted = true;

        const loadTribes = async () => {
            // If App.tsx passed loading prop as false BUT we have no tribes, we force a fetch yourself.
            try {
                // Check cache first for instant render
                const cached = localStorage.getItem('tribe_storage_tribes');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setTribes(parsed);
                        // Don't verify loading false yet, wait for network verify
                    }
                }

                console.log("🔍 TribesPage: Fetching tribes from API...");
                const response = await api.fetchTribes();

                if (isMounted) {
                    setTribes(response.data);
                    setIsLoading(false);
                    // Update cache
                    localStorage.setItem('tribe_storage_tribes', JSON.stringify(response.data));
                }
            } catch (err) {
                console.error("❌ TribesPage: Failed to load tribes", err);
                if (isMounted) {
                    setError("Failed to load tribes. Please try again.");
                    setIsLoading(false);
                }
            }
        };

        loadTribes();

        return () => { isMounted = false; };
    }, []);

    const handleTribeCreated = (newTribe: Tribe) => {
        setTribes(prev => [newTribe, ...prev]);
        setIsCreateModalOpen(false);
    };

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
                <LoadingMessage>Finding your community...</LoadingMessage>
            )}

            {/* EMPTY STATE - Only show if not getting loading/error and truly 0 items */}
            {!isLoading && !error && tribes.length === 0 && (
                <EmptyState>
                    <h3>No Tribes Found</h3>
                    <p>Be the first to start a community!</p>
                </EmptyState>
            )}

            {/* DATA GRID */}
            <Grid>
                {tribes.map(tribe => (
                    <TribeCard key={tribe.id} tribe={tribe} currentUser={currentUser} />
                ))}
            </Grid>

            {/* MODALS */}
            {isCreateModalOpen && (
                <CreateTribeModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleTribeCreated}
                />
            )}
        </Container>
    );
};

export default TribesPage;
