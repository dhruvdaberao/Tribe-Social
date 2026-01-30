import React from 'react';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface UserCardProps {
    user: User;
    currentUser: User;
    onToggleFollow: (targetUserId: string) => void;
    onViewProfile: (user: User) => void;
    layout?: 'card' | 'list';
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUser, onToggleFollow, onViewProfile, layout = 'card' }) => {
    const isFollowing = currentUser.following.includes(user.id);

    if (layout === 'list') {
        return (
            <div className="bg-surface p-3 rounded-2xl shadow-sm border border-border flex items-center justify-between w-full">
                <div className="flex items-center overflow-hidden flex-1 cursor-pointer" onClick={() => onViewProfile(user)}>
                    <div className="w-12 h-12 rounded-full flex-shrink-0">
                        <UserAvatar user={user} className="w-full h-full" />
                    </div>
                    <div className="ml-4 overflow-hidden text-left">
                        <p className="font-bold text-primary truncate hover:underline">{user.name}</p>
                        <p className="text-sm text-secondary truncate">@{user.username}</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggleFollow(user.id)}
                    className={`font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm ml-2 flex-shrink-0 ${isFollowing
                            ? 'bg-surface text-primary border border-border hover:bg-background'
                            : 'bg-accent text-accent-text hover:bg-accent-hover'
                        }`}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>
        )
    }

    return (
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex flex-col text-center items-center h-full transition-transform transform hover:-translate-y-1">
            <div
                className="w-20 h-20 rounded-full cursor-pointer flex-shrink-0"
                onClick={() => onViewProfile(user)}
            >
                <UserAvatar user={user} className="w-full h-full" />
            </div>
            <div className="mt-3 overflow-hidden">
                <p
                    className="font-bold text-primary truncate cursor-pointer hover:underline"
                    onClick={() => onViewProfile(user)}
                >
                    {user.name}
                </p>
                <p className="text-sm text-secondary truncate">@{user.username}</p>
            </div>
            <p className="text-sm text-secondary my-4 line-clamp-3 px-2 flex-grow">
                {user.bio || 'No bio provided.'}
            </p>
            <button
                onClick={() => onToggleFollow(user.id)}
                className={`w-full font-semibold px-4 py-2 rounded-lg transition-colors text-sm mt-auto ${isFollowing
                        ? 'bg-surface text-primary border border-border hover:bg-background'
                        : 'bg-accent text-accent-text hover:bg-accent-hover'
                    }`}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </button>
        </div>
    );
};

export default UserCard;