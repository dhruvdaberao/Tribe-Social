import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, ShieldCheck, ArrowLeft, User as UserIcon, Users, Crown, Flag } from 'lucide-react';
import { User } from '../../types';

interface AdminSettingsPageProps {
  currentUser: User | null;
}

const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back to Settings
      </button>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Admin Settings</h1>
            <p className="text-sm text-secondary mt-1">Moderation dashboard for Tribe Social.</p>
          </div>
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold">Signed in as @{currentUser?.username}</span>
          </div>
        </div>

        <div className="space-y-4">
          <AdminNavItem icon={<FileText size={24} />} text="Posts" onClick={() => navigate('/admin/posts')} />
          <AdminNavItem icon={<UserIcon size={24} />} text="Users" onClick={() => navigate('/admin/users')} />
          <AdminNavItem icon={<Users size={24} />} text="Tribes" onClick={() => navigate('/admin/tribes')} />
          <AdminNavItem icon={<Flag size={24} />} text="Reports" onClick={() => navigate('/admin/reports')} />
          {currentUser?.isSuperAdmin && (
            <AdminNavItem icon={<Crown size={24} />} text="Super Admin" onClick={() => navigate('/super-admin')} />
          )}
        </div>
      </div>
    </div>
  );
};

const AdminNavItem: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void }> = ({ icon, text, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-background hover:bg-border rounded-xl transition-colors group">
    <div className="flex items-center space-x-4">
      <span className="text-primary group-hover:text-accent transition-colors">{icon}</span>
      <span className="font-semibold text-primary">{text}</span>
    </div>
    <ChevronRight size={20} className="text-secondary" />
  </button>
);

export default AdminSettingsPage;
