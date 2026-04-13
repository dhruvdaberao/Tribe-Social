import React from 'react';
import { User } from '../../types';

interface MessageOptionsMenuProps {
  user: User | null;
  isAutoDeleteEnabled: boolean;
  isBlocking?: boolean;
  isActionLoading?: boolean;
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
  isActionLoading = false,
  onViewProfile,
  onClearChat,
  onToggleAutoDelete,
  onBlockUser,
  onClose,
}) => {
  if (!user?.id) return null;

  const disableActions = isBlocking || isActionLoading;

  return (
    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-150">
      <button
        type="button"
        disabled={disableActions}
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors disabled:opacity-60"
        onClick={() => {
          onClose();
          onViewProfile(user);
        }}
      >
        View Profile
      </button>
      <button
        type="button"
        disabled={disableActions}
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors disabled:opacity-60"
        onClick={() => {
          onClose();
          onClearChat(user.id);
        }}
      >
        Clear Chat
      </button>
      <button
        type="button"
        disabled={disableActions}
        className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors disabled:opacity-60"
        onClick={() => {
          onClose();
          onToggleAutoDelete(user.id);
        }}
      >
        {isAutoDeleteEnabled ? 'Disable 24h auto delete' : 'Enable 24h auto delete'}
      </button>
      <button
        type="button"
        disabled={disableActions}
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
