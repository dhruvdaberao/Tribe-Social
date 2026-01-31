import React from 'react';
import { User } from '../../types';
import UserCard from '../users/UserCard';
import { removeFollower } from '../../api';
import { toast } from '../common/Toast';

interface FollowListModalProps {
    title: string;
    userIds: string[];
    allUsers: User[];
    currentUser: User;
    onClose: () => void;
    onToggleFollow: (targetUserId: string) => void;
    onViewProfile: (user: User) => void;
    isOwnProfile?: boolean;
    listType?: 'followers' | 'following';
}

const FollowListModal: React.FC<FollowListModalProps> = ({ title, userIds, allUsers, currentUser, onClose, onToggleFollow, onViewProfile, isOwnProfile, listType }) => {
    const [localUserIds, setLocalUserIds] = React.useState<string[]>(userIds);

    React.useEffect(() => {
        setLocalUserIds(userIds);
    }, [userIds]);

    const usersToShow = allUsers.filter(u => localUserIds.includes(u.id));

    const handleRemoveFollower = async (userId: string) => {
        try {
            await removeFollower(userId);
            setLocalUserIds(prev => prev.filter(id => id !== userId));
            toast.success("Follower removed");
        } catch (error) {
            console.error("Failed to remove follower:", error);
            toast.error("Failed to remove follower");
        }
    };

    console.log('FollowListModal Render:', { title, userIdsCount: localUserIds.length, usersToShowCount: usersToShow.length });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-border">
                    <h2 className="text-xl font-bold text-primary">{title}</h2>
                    <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto p-4">
                    {usersToShow.length > 0 ? (
                        <div className="space-y-3">
                            {usersToShow.map(user => (
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