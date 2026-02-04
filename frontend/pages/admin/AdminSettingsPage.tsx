import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, UsersRound, ChevronRight, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface AdminSettingsPageProps {
  currentUser: User | null;
}

const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Admin Settings</h1>
            <p className="text-sm text-secondary mt-1">Moderation dashboard for Tribe Social.</p>
          </div>
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={18} />
            <span className="text-sm font-semibold">@{currentUser?.username}</span>
          </div>
        </div>

        <div className="space-y-4">
          <SettingsNavItem
            icon={<FileText size={22} />}
            text="Posts"
            onClick={() => navigate('/admin/posts')}
          />
          <SettingsNavItem
            icon={<Users size={22} />}
            text="Users"
            onClick={() => navigate('/admin/users')}
          />
          <SettingsNavItem
            icon={<UsersRound size={22} />}
            text="Tribes"
            onClick={() => navigate('/admin/tribes')}
          />
        </div>
      </div>
    </div>
  );
};

const SettingsNavItem: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void }> = ({ icon, text, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-background hover:bg-border rounded-xl transition-colors group">
    <div className="flex items-center space-x-4">
      <span className="text-primary group-hover:text-accent transition-colors">{icon}</span>
      <span className="font-semibold text-primary">{text}</span>
    </div>
    <ChevronRight size={18} className="text-secondary" />
  </button>
);

export default AdminSettingsPage;
