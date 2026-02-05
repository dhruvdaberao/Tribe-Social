import React from 'react';
import { User } from '../../types';
import UserCard from '../users/UserCard';
import { removeFollower } from '../../api';
import { toast } from '../common/Toast';

interface FollowListModalProps {
    title: string;
    users: User[];
    currentUser: User;
    onClose: () => void;
    onToggleFollow: (
        targetUserId: string,
        viewedUser?: User | null,
        setViewedUser?: React.Dispatch<React.SetStateAction<User | null>>
    ) => void;
    onViewProfile: (user: User) => void;
    isOwnProfile?: boolean;
    listType?: 'followers' | 'following';
    isLoading?: boolean;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ title, users, currentUser, onClose, onToggleFollow, onViewProfile, isOwnProfile, listType, isLoading }) => {
    const [localUsers, setLocalUsers] = React.useState<User[]>(users);

    React.useEffect(() => {
        setLocalUsers(Array.isArray(users) ? users : []);
    }, [users]);

    const handleRemoveFollower = async (userId: string) => {
        try {
            await removeFollower(userId);
            setLocalUsers(prev => prev.filter(user => user.id !== userId));
            toast.success("Follower removed");
        } catch (error) {
            console.error("Failed to remove follower:", error);
            toast.error("Failed to remove follower");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-border">
                    <h2 className="text-xl font-bold text-primary">{title}</h2>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto p-4">
                    {isLoading ? (
                        <p className="text-secondary text-center py-8">Loading...</p>
                    ) : localUsers.length > 0 ? (
                        <div className="space-y-3">
                            {localUsers.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onToggleFollow={onToggleFollow}
                                    onViewProfile={onViewProfile}
                                    layout="list"
                                    isOwnProfile={isOwnProfile}
                                    listType={listType}
                                    onRemove={handleRemoveFollower}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-secondary text-center py-8">No users to show.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;
