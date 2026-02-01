import React from 'react';
import { User } from '../../types';

interface UserAvatarProps {
  user: User | null;
  className?: string;
  isOnline?: boolean;
}

const UserPlaceholderIcon = ({ className = '' }: { className?: string }) => (
  <div className={`bg-accent/20 border border-border rounded-full flex items-center justify-center text-secondary ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3/5 h-3/5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  </div>
);

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = 'w-10 h-10', isOnline = false }) => {
  const [imgError, setImgError] = React.useState(false);

  // Reset error state when user/avatar changes
  React.useEffect(() => {
    setImgError(false);
  }, [user?.avatarUrl]);

  return (
    <div className={`${className} relative rounded-full`}>
      <div className="absolute inset-0 rounded-full overflow-hidden bg-surface">
        {user?.avatarUrl && !imgError ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <UserPlaceholderIcon className="w-full h-full" />
        )}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-surface z-10"></span>
      )}
    </div>
  );
};

export default UserAvatar;