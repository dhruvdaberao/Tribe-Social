import React, { useState } from 'react';
import { Conversation, User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import MessageOptionsMenu from './MessageOptionsMenu';
import { AI_USER_ID } from '../../constants/ai';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  currentUser: User;
  chukUser: User;
  userMap: Map<string, User>;
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onViewProfile: (user: User) => void;
  onNewMessage: () => void;
  unreadCounts: { [key: string]: number };
  onClearConversation: (otherUserId: string) => void;
  onBlockUser: (otherUser: User) => void;
  onToggleAutoDelete: (otherUserId: string) => void;
  autoDeleteMap: Record<string, boolean>;
  actionLoadingByUserId?: Record<string, boolean>;
  blockLoadingByUserId?: Record<string, boolean>;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  currentUser,
  chukUser,
  userMap,
  activeConversationId,
  onSelectConversation,
  onViewProfile,
  onNewMessage,
  unreadCounts,
  onClearConversation,
  onBlockUser,
  onToggleAutoDelete,
  autoDeleteMap,
  actionLoadingByUserId = {},
  blockLoadingByUserId = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const otherParticipantId = conv.participants.find((p) => p.id !== currentUser.id)?.id;
    if (!otherParticipantId) return false;
    const otherParticipant = userMap.get(otherParticipantId);
    if (!otherParticipant) return false;
    const lowerQ = searchQuery.toLowerCase();
    return (
      otherParticipant.name.toLowerCase().includes(lowerQ) ||
      otherParticipant.username.toLowerCase().includes(lowerQ)
    );
  });

  const showChuk =
    !searchQuery.trim() ||
    chukUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chukUser.username.toLowerCase().includes(searchQuery.toLowerCase());

  const chukConversation: Conversation = {
    id: chukUser.id,
    participants: [{ id: currentUser.id }, { id: chukUser.id }],
    lastMessage: 'Your personal guide & friend',
    timestamp: new Date().toISOString(),
    messages: [],
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background pt-16 md:pt-0">
      <div className="messages-header flex flex-col flex-shrink-0 border-b border-border bg-background px-4 py-4 md:px-5 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display text-primary md:text-3xl">Messages</h2>
          <button onClick={onNewMessage} className="rounded-full border border-border bg-surface p-2 text-primary transition-colors hover:bg-accent hover:text-accent-text shadow-sm" aria-label="New Message">
            <PlusIcon />
          </button>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-primary placeholder-secondary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow shadow-sm"
          />
        </div>
      </div>

      <div className="messages-container flex-1 overflow-y-auto pb-[80px]">
        {showChuk && (
          <ConversationItem
            conversation={chukConversation}
            otherParticipant={chukUser}
            isActive={chukConversation.id === activeConversationId}
            onSelect={onSelectConversation}
            onViewProfile={onViewProfile}
            unreadCount={0}
            isAutoDeleteEnabled={!!autoDeleteMap[chukUser.id]}
            onClearConversation={onClearConversation}
            onBlockUser={onBlockUser}
            onToggleAutoDelete={onToggleAutoDelete}
            isActionLoading={!!actionLoadingByUserId[chukUser.id]}
            isBlocking={!!blockLoadingByUserId[chukUser.id]}
          />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center p-8 text-center text-secondary">
            <img src="/busstop.gif" width={80} alt="Loading..." className="mb-3" />
            <p>Loading your chats...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            <p>{searchQuery.trim() ? 'No chats match your search.' : 'No user conversations yet.'}</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherParticipantId = conv.participants.find((p) => p.id !== currentUser.id)?.id;
            if (!otherParticipantId) return null;
            const otherParticipant = userMap.get(otherParticipantId);
            if (!otherParticipant) return null;

            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                otherParticipant={otherParticipant}
                isActive={conv.id === activeConversationId}
                onSelect={onSelectConversation}
                onViewProfile={onViewProfile}
                unreadCount={unreadCounts[otherParticipantId] || 0}
                isAutoDeleteEnabled={!!autoDeleteMap[otherParticipantId]}
                onClearConversation={onClearConversation}
                onBlockUser={onBlockUser}
                onToggleAutoDelete={onToggleAutoDelete}
                isActionLoading={!!actionLoadingByUserId[otherParticipantId]}
                isBlocking={!!blockLoadingByUserId[otherParticipantId]}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  otherParticipant: User;
  isActive: boolean;
  onSelect: (conv: Conversation) => void;
  onViewProfile: (user: User) => void;
  unreadCount: number;
  isAutoDeleteEnabled: boolean;
  onClearConversation: (otherUserId: string) => void;
  onBlockUser: (otherUser: User) => void;
  onToggleAutoDelete: (otherUserId: string) => void;
  isActionLoading?: boolean;
  isBlocking?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  otherParticipant,
  isActive,
  onSelect,
  onViewProfile,
  unreadCount,
  isAutoDeleteEnabled,
  onClearConversation,
  onBlockUser,
  onToggleAutoDelete,
  isActionLoading = false,
  isBlocking = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`chat-item relative mx-3 my-2 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors border border-border shadow-sm ${isActive ? 'bg-background ring-1 ring-accent' : 'bg-surface hover:bg-background'}`}
    >
      {otherParticipant.id === AI_USER_ID ? (
        <img src="/chuk-ai.png" alt="Psyduck AI" className="h-12 w-12 object-contain" />
      ) : (
        <UserAvatar user={otherParticipant} className="h-12 w-12" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{otherParticipant.name}</p>
        <p className="truncate text-sm text-secondary">{conversation.lastMessage || 'Sent an attachment'}</p>
      </div>

      {unreadCount > 0 && <div className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-text">{unreadCount}</div>}

      <button
        type="button"
        aria-label="Conversation actions"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen((prev) => !prev);
        }}
        className="ml-1 rounded-full p-2 text-secondary hover:bg-background hover:text-primary"
      >
        <MoreIcon />
      </button>

      {isMenuOpen && (
        <div onClick={(event) => event.stopPropagation()} className="absolute right-3 top-14 z-20">
          <MessageOptionsMenu
            user={otherParticipant}
            isAutoDeleteEnabled={isAutoDeleteEnabled}
            onViewProfile={onViewProfile}
            onClearChat={onClearConversation}
            onToggleAutoDelete={onToggleAutoDelete}
            onBlockUser={onBlockUser}
            isActionLoading={isActionLoading}
            isBlocking={isBlocking}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const MoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6h.01M12 12h.01M12 18h.01" /></svg>;

export default ConversationList;
