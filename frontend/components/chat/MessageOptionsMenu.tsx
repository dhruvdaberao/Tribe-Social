import React from 'react';
import { User } from '../../types';

interface MessageOptionsMenuProps {
  user: User | null;
  isAutoDeleteEnabled: boolean;
  isBlocking?: boolean;
  onViewProfile: (user: User) => void;
  onClearChat: (userId: string) => void;
  onToggleAutoDelete: (userId: string) => void;
  onBlockUser: (user: User) => void;
  onClose: () => void;
}

const MessageOptionsMenu: React.FC<MessageOptionsMenuProps> = ({
  user,
  isAutoDeleteEnabled,
  isBlocking = false,
  onViewProfile,
  onClearChat,
  onToggleAutoDelete,
  onBlockUser,
  onClose,
}) => {
  if (!user?.id) return null;

  return (
    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-150">
      <button
        type="button"
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors"
        onClick={() => {
          console.info('[MessageOptionsMenu] View Profile userId:', user.id);
          onClose();
          onViewProfile(user);
        }}
      >
        View Profile
      </button>
      <button
        type="button"
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors"
        onClick={() => {
          onClose();
          onClearChat(user.id);
        }}
      >
        Clear Chat
      </button>
      <button
        type="button"
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors"
        onClick={() => {
          onClose();
          onToggleAutoDelete(user.id);
        }}
      >
        {isAutoDeleteEnabled ? 'Disable 24h Auto Delete' : 'Enable 24h Auto Delete'}
      </button>
      <button
        type="button"
        disabled={isBlocking}
        className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-60"
        onClick={() => {
          onClose();
          onBlockUser(user);
        }}
      >
        {isBlocking ? 'Blocking user...' : 'Block User'}
      </button>
    </div>
  );
};

export default MessageOptionsMenu;
