import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersRound } from 'lucide-react';

const AdminTribesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Admin Tribes</h1>
            <p className="text-sm text-secondary mt-1">Tribe moderation tools will live here.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm font-semibold text-secondary hover:text-primary"
          >
            Back to Admin Settings
          </button>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-background p-6 text-sm text-secondary flex items-center gap-3">
          <UsersRound size={18} className="text-accent" />
          <span>Coming soon.</span>
        </div>
      </div>
    </div>
  );
};

export default AdminTribesPage;
