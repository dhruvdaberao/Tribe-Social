import React, { useState } from 'react';
import { Conversation, User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  currentUser: User;
  chukUser: User;
  userMap: Map<string, User>;
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewMessage: () => void;
  unreadCounts: { [key: string]: number };
  onClearConversation: (otherUserId: string) => void;
  onToggleBlock: (otherUserId: string) => void;
  onToggleAutoDelete: (otherUserId: string) => void;
  autoDeleteMap: Record<string, boolean>;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  currentUser,
  chukUser,
  userMap,
  activeConversationId,
  onSelectConversation,
  onNewMessage,
  unreadCounts,
  onClearConversation,
  onToggleBlock,
  onToggleAutoDelete,
  autoDeleteMap
}) => {
  const chukConversation: Conversation = {
    id: chukUser.id,
    participants: [{ id: currentUser.id }, { id: chukUser.id }],
    lastMessage: 'Your personal guide & friend',
    timestamp: new Date().toISOString(),
    messages: []
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background pt-16 md:pt-0">
      <div className="messages-header flex flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 py-4 md:px-5">
        <h2 className="text-2xl font-bold font-display text-primary md:text-3xl">Messages</h2>
        <button onClick={onNewMessage} className="rounded-full border border-border bg-surface p-2 text-primary transition-colors hover:bg-accent hover:text-accent-text shadow-sm" aria-label="New Message">
          <PlusIcon />
        </button>
      </div>

      <div className="messages-container flex-1 overflow-y-auto pb-[80px]">
        <ConversationItem
          key={chukConversation.id}
          conversation={chukConversation}
          otherParticipant={chukUser}
          isActive={chukConversation.id === activeConversationId}
          onSelect={onSelectConversation}
          unreadCount={0}
          isBlocked={(currentUser.blockedUsers || []).includes(chukUser.id)}
          isAutoDeleteEnabled={!!autoDeleteMap[chukUser.id]}
          onClearConversation={onClearConversation}
          onToggleBlock={onToggleBlock}
          onToggleAutoDelete={onToggleAutoDelete}
        />

        {isLoading ? (
          <div className="flex flex-col items-center p-8 text-center text-secondary">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p>Loading your chats...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            <p>No user conversations yet.</p>
            <button onClick={onNewMessage} className="mt-2 text-sm font-semibold text-accent hover:underline">
              Start a new chat!
            </button>
          </div>
        ) : (
          conversations.map(conv => {
            const otherParticipantId = conv.participants.find(p => p.id !== currentUser.id)?.id;
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
                unreadCount={unreadCounts[otherParticipantId] || 0}
                isBlocked={(currentUser.blockedUsers || []).includes(otherParticipantId)}
                isAutoDeleteEnabled={!!autoDeleteMap[otherParticipantId]}
                onClearConversation={onClearConversation}
                onToggleBlock={onToggleBlock}
                onToggleAutoDelete={onToggleAutoDelete}
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
  unreadCount: number;
  isBlocked: boolean;
  isAutoDeleteEnabled: boolean;
  onClearConversation: (otherUserId: string) => void;
  onToggleBlock: (otherUserId: string) => void;
  onToggleAutoDelete: (otherUserId: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  otherParticipant,
  isActive,
  onSelect,
  unreadCount,
  isBlocked,
  isAutoDeleteEnabled,
  onClearConversation,
  onToggleBlock,
  onToggleAutoDelete
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`chat-item relative mx-3 my-2 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors border border-border shadow-sm ${isActive ? 'bg-background ring-1 ring-accent' : 'bg-surface hover:bg-background'}`}
    >
      <div className="relative flex-shrink-0">
        {otherParticipant.id === 'chuk-ai' ? (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-transparent">
            <img src="/chuk-ai.png" alt="Psyduck AI" className="h-full w-full object-contain" />
          </div>
        ) : (
          <UserAvatar user={otherParticipant} className="h-12 w-12" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{otherParticipant.name}</p>
        <p className="truncate text-sm text-secondary">{conversation.lastMessage || 'Sent an attachment'}</p>
      </div>

      {unreadCount > 0 && (
        <div className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-text">
          {unreadCount}
        </div>
      )}

      <button
        type="button"
        aria-label="Conversation actions"
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen(prev => !prev);
        }}
        className="ml-1 rounded-full p-2 text-secondary hover:bg-background hover:text-primary"
      >
        <MoreIcon />
      </button>

      {isMenuOpen && (
        <div
          className="absolute right-3 top-14 z-20 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-background"
            onClick={() => {
              setIsMenuOpen(false);
              onClearConversation(otherParticipant.id);
            }}
          >
            Clear chat
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-background"
            onClick={() => {
              setIsMenuOpen(false);
              onToggleAutoDelete(otherParticipant.id);
            }}
          >
            {isAutoDeleteEnabled ? 'Disable 24h auto delete' : 'Enable 24h auto delete'}
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
            onClick={() => {
              setIsMenuOpen(false);
              onToggleBlock(otherParticipant.id);
            }}
          >
            {isBlocked ? 'Unblock user' : 'Block user'}
          </button>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const MoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6h.01M12 12h.01M12 18h.01" /></svg>;

export default ConversationList;
