
import React, { useState } from 'react';
import { User } from '../../types';
import BlockedListModal from '../profile/BlockedListModal';
import { toast } from '../common/Toast';
import * as api from '../../api';
import { User as UserIconLucide, Ban, LogOut, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccountPageProps {
    currentUser: User;
    allUsers: User[];
    onLogout: () => void;
    onDeleteAccount: () => void;
    onToggleBlock: (targetUserId: string) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ currentUser, allUsers, onLogout, onDeleteAccount, onToggleBlock }) => {
    const navigate = useNavigate();
    const [isBlockedModalOpen, setBlockedModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isAccountInfoModalOpen, setAccountInfoModalOpen] = useState(false);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back
            </button>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
                <h1 className="text-2xl font-bold font-display text-primary mb-6">Account Settings</h1>

                <div className="space-y-4">
                    <SettingsButton icon={<UserIconLucide size={24} />} text="Account Information" detail={`@${currentUser.username}`} onClick={() => setAccountInfoModalOpen(true)} />
                    <SettingsButton icon={<Ban size={24} />} text="Blocked Users" detail={`${(currentUser.blockedUsers || []).length} users`} onClick={() => setBlockedModalOpen(true)} />
                    <SettingsButton icon={<LogOut size={24} />} text="Logout" onClick={onLogout} />
                    <SettingsButton icon={<Trash2 size={24} />} text="Delete Account" onClick={() => setDeleteConfirmOpen(true)} isDestructive />
                </div>
            </div>

            {isAccountInfoModalOpen && <AccountInfoModal user={currentUser} onClose={() => setAccountInfoModalOpen(false)} />}
            {isBlockedModalOpen && <BlockedListModal userIds={currentUser.blockedUsers || []} allUsers={allUsers} onClose={() => setBlockedModalOpen(false)} onToggleBlock={onToggleBlock} />}
            {isDeleteConfirmOpen && <DeleteAccountModal onClose={() => setDeleteConfirmOpen(false)} onConfirm={onDeleteAccount} />}
        </div>
    );
};

const SettingsButton: React.FC<{ icon: React.ReactNode, text: string, detail?: string, onClick: () => void, isDestructive?: boolean }> = ({ icon, text, detail, onClick, isDestructive }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isDestructive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-background hover:bg-border'}`}>
        <div className="flex items-center space-x-4">
            <span className="text-current opacity-80">{icon}</span>
            <span className="font-semibold">{text}</span>
        </div>
        <div className="flex items-center space-x-2 text-secondary">
            {detail && <span>{detail}</span>}
            <ChevronRight size={20} />
        </div>
    </button>
);

const DeleteAccountModal: React.FC<{ onClose: () => void, onConfirm: () => void }> = ({ onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
            <h2 className="text-xl font-bold text-primary">Delete Account</h2>
            <p className="text-secondary my-4">Are you sure you want to permanently delete your account and all of your data? This action is irreversible.</p>
            <div className="flex justify-end space-x-4 mt-6">
                <button onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button>
                <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700">Confirm Delete</button>
            </div>
        </div>
    </div>
);

const AccountInfoModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        username: user.username,
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const updateData: any = { name: formData.name, username: formData.username };
            if (formData.email) updateData.email = formData.email;
            if (formData.password) updateData.password = formData.password;

            await api.updateProfile(updateData);
            toast.success("Account updated successfully!");
            onClose();
            // Force reload or global update might be needed, but toast usually enough for now
            // window.location.reload(); 
        } catch (error) {
            console.error("Failed to update account:", error);
            toast.error("Failed to update account. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-border">
                    <h2 className="text-xl font-bold text-primary">Edit Account Info</h2>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-secondary">Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-secondary">Username</label>
                        <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-secondary">New Email (Optional)</label>
                        <input type="email" placeholder="Enter new email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-secondary">New Password (Optional)</label>
                        <input type="password" placeholder="Enter new password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background mr-2">Cancel</button>
                        <button type="submit" disabled={isLoading} className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountPage;
