import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { toast } from '../common/Toast';
import ConfirmationModal from '../common/ConfirmationModal';
import * as api from '../../api';

interface TribeMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberIds: string[];
  userMap: Map<string, User>;
  onViewProfile?: (user: User) => void;
  ownerId?: string;
  currentUserId?: string;
  tribeId?: string;
  tribeName?: string;
  onMemberKicked?: (memberId: string) => void;
}

const TribeMembersModal: React.FC<TribeMembersModalProps> = ({
  isOpen,
  onClose,
  memberIds,
  userMap,
  onViewProfile,
  ownerId,
  currentUserId,
  tribeId,
  tribeName,
  onMemberKicked
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberIdsState, setMemberIdsState] = useState(memberIds);
  const [kickTarget, setKickTarget] = useState<User | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMemberIdsState(memberIds);
      setSearchTerm('');
    }
  }, [isOpen, memberIds]);

  const members = useMemo(() => {
    return memberIdsState.map(id => userMap.get(id)).filter((user): user is User => !!user);
  }, [memberIdsState, userMap]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return members;
    return members.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term)
    );
  }, [searchTerm, members]);

  if (!isOpen) return null;

  const isChief = !!currentUserId && !!ownerId && currentUserId === ownerId;

  const handleConfirmKick = async () => {
    if (!kickTarget || !tribeId) return;
    const previousMembers = memberIdsState;
    setIsKicking(true);
    setMemberIdsState(prev => prev.filter(id => id !== kickTarget.id));
    try {
      await api.kickTribeMember(tribeId, kickTarget.id);
      toast.success(`Removed @${kickTarget.username}`);
      onMemberKicked?.(kickTarget.id);
    } catch (error) {
      setMemberIdsState(previousMembers);
      toast.error('Failed to remove member.');
    } finally {
      setIsKicking(false);
      setKickTarget(null);
    }
  };

  return ReactDOM.createPortal(
    <>
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
                    className="p-4 flex items-center gap-3 hover:bg-background transition-colors"
                  >
                    <button type="button" onClick={() => onViewProfile?.(user)} className="flex items-center gap-3 flex-1 text-left">
                      <UserAvatar user={user} className="w-10 h-10 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-primary truncate">{user.name}</p>
                          {ownerId && user.id === ownerId && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold border border-accent/30">
                              Chief
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-secondary truncate">@{user.username}</p>
                      </div>
                    </button>
                    {isChief && user.id !== ownerId && (
                      <button
                        type="button"
                        onClick={() => setKickTarget(user)}
                        className="px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-red-400 hover:bg-red-500/10"
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
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!kickTarget}
        title="Kick Member"
        message={kickTarget ? `Kick @${kickTarget.username} from @${tribeName || 'this tribe'}?` : ''}
        confirmText={isKicking ? 'Kicking...' : 'Kick'}
        cancelText="Cancel"
        variant="danger"
        onClose={() => setKickTarget(null)}
        onConfirm={handleConfirmKick}
      />
    </>,
    document.body
  );
};

export default TribeMembersModal;
