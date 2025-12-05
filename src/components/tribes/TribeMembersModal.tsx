import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface TribeMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberIds: string[];
  userMap: Map<string, User>;
  onViewProfile: (user: User) => void;
}

const TribeMembersModal: React.FC<TribeMembersModalProps> = ({ isOpen, onClose, memberIds, userMap, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md h-[70vh] flex flex-col border border-border" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Tribe Members ({members.length})</h2>
            <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary text-center p-8">No members found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TribeMembersModal;