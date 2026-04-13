import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';

interface AIProfileScreenProps {
  user: User;
}

const AIProfileScreen: React.FC<AIProfileScreenProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6 md:px-6 md:pb-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-background"
      >
        Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="h-24 bg-gradient-to-r from-[#5A3E36]/20 via-[#8B5E3C]/20 to-[#5A3E36]/20" />
        <div className="px-6 pb-6">
          <img
            src={user.avatarUrl || '/chuk-ai.png'}
            alt="Psyduck"
            className="-mt-10 h-20 w-20 rounded-full border-4 border-surface bg-background object-contain p-1"
          />
          <h1 className="mt-3 text-2xl font-bold text-primary">{user.name}</h1>
          <p className="text-sm text-secondary">@{user.username}</p>

          <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-sm text-secondary">
            Psyduck has hidden his followers and following using his special Psyduck ability 🐤
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProfileScreen;
