import React, { useState, useMemo } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import ModalPortal from '../common/ModalPortal';

interface TribeMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberIds: string[];
  userMap: Map<string, User>;
  onViewProfile?: (user: User) => void;
  ownerId?: string;
  currentUserId?: string;
  canKick?: boolean;
  onKick?: (userId: string) => Promise<void> | void;
}

const TribeMembersModal: React.FC<TribeMembersModalProps> = ({ isOpen, onClose, memberIds, userMap, onViewProfile, ownerId, currentUserId, canKick = false, onKick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kickTargetId, setKickTargetId] = useState<string | null>(null);

  const members = useMemo(() => {
    return memberIds.map(id => userMap.get(id)).filter((user): user is User => !!user);
  }, [memberIds, userMap]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return members;
    return members.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term)
    );
  }, [searchTerm, members]);

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="bg-black/60 backdrop-blur-sm"
      contentClassName="w-full max-w-md"
    >
      <div className="flex h-[70vh] w-full flex-col rounded-2xl border border-border bg-surface shadow-xl">
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Tribe Members ({members.length})</h2>
            <button onClick={onClose} className="text-2xl leading-none text-secondary hover:text-primary" aria-label="Close members modal">&times;</button>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-lg border border-border bg-background p-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredMembers.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredMembers.map(user => (
                <div
                  key={user.id}
                  onClick={() => onViewProfile?.(user)}
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-background"
                >
                  <div className="flex items-center min-w-0">
                  <UserAvatar user={user} className="h-10 w-10 flex-shrink-0" />
                  <div className="ml-3 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-primary">{user.name}</p>
                      {ownerId && user.id === ownerId && (
                        <span className="rounded-full border border-accent/30 bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                          Chief
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-secondary">@{user.username}</p>
                  </div>
                  </div>
                  {canKick && onKick && user.id !== ownerId && user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setKickTargetId(user.id);
                      }}
                      className="ml-3 rounded-lg border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-secondary">No members found.</p>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(kickTargetId)}
        title="Remove Member"
        message="Remove this member from the tribe? They can rejoin unless the tribe is private."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setKickTargetId(null)}
        onConfirm={() => {
          if (kickTargetId && onKick) onKick(kickTargetId);
          setKickTargetId(null);
        }}
      />
    </ModalPortal>
  );
};

export default TribeMembersModal;
