import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import ModalWrapper from '../common/ModalWrapper';
import UserAvatar from '../common/UserAvatar';

interface TribeMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberIds: string[];
  userMap: Map<string, User>;
  onViewProfile: (user: User) => void;
  currentUser: User;
  tribeOwnerId: string;
  onKickMember: (userId: string) => void;
}

const TribeMembersModal: React.FC<TribeMembersModalProps> = ({ isOpen, onClose, memberIds, userMap, onViewProfile, currentUser, tribeOwnerId, onKickMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isOwner = currentUser?.id === tribeOwnerId;

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

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} title={`Tribe Members (${members.length})`} showCloseButton className="h-[70vh] flex flex-col">
      <div className="p-4 border-b border-border flex-shrink-0">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
          autoFocus
        />
      </div>

      <div className="overflow-y-auto flex-1">
        {filteredMembers.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredMembers.map(user => (
              <div
                key={user.id}
                onClick={() => onViewProfile(user)}
                className="p-4 flex items-center cursor-pointer hover:bg-background transition-colors"
              >
                <UserAvatar user={user} className="w-10 h-10 flex-shrink-0" />
                <div className="ml-3 overflow-hidden">
                  <p className="font-semibold text-primary truncate">{user.name}</p>
                  <p className="text-sm text-secondary truncate">@{user.username}</p>
                </div>
                {isOwner && user.id !== tribeOwnerId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to kick @${user.username}?`)) {
                        onKickMember(user.id);
                      }
                    }}
                    className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-500/10 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary text-center p-8">No members found.</p>
        )}
      </div>
    </ModalWrapper>
  );
};

export default TribeMembersModal;