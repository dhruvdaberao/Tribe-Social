import React from 'react';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface UserCardProps {
    user: User;
    currentUser: User;
    onToggleFollow: (
        targetUserId: string,
        viewedUser?: User | null,
        setViewedUser?: React.Dispatch<React.SetStateAction<User | null>>
    ) => void;
    onViewProfile: (user: User) => void;
    layout?: 'card' | 'list';
    isOwnProfile?: boolean;
    listType?: 'followers' | 'following';
    onRemove?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUser, onToggleFollow, onViewProfile, layout = 'card', isOwnProfile, listType, onRemove }) => {
    const isFollowing = Array.isArray(currentUser.following) && currentUser.following.includes(user.id);

    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Call parent handler
        onToggleFollow(user.id);
    };

    const renderButton = () => {
        // CRITICAL FIX: Don't show follow button for own profile
        if (user.id === currentUser.id) {
            return null;
        }

        // 1. My Following List -> Show "Unfollow"
        if (isOwnProfile && listType === 'following') {
            return (
                <button
                    onClick={handleFollowClick}
                    className="font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm ml-2 flex-shrink-0 bg-surface text-primary border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                    Unfollow
                </button>
            );
        }

        // 2. My Followers List -> Show "Remove"
        if (isOwnProfile && listType === 'followers') {
            return (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove && onRemove(user.id); }}
                    className="font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm ml-2 flex-shrink-0 bg-surface text-primary border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                    Remove
                </button>
            );
        }

        // 3. Default Behavior (Visiting someone else, or Search)
        return (
            <button
                onClick={handleFollowClick}
                className={`font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm ml-2 flex-shrink-0 ${isFollowing
                    ? 'bg-surface text-primary border border-border hover:bg-background'
                    : 'bg-accent text-accent-text hover:bg-accent-hover'
                    }`}
            >
                {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
        );
    };

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
                {renderButton()}
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
            <div className="mt-auto w-full">
                {renderButton()}
            </div>
        </div>
    );
};

export default UserCard;
