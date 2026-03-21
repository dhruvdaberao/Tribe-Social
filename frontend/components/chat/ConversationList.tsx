import React, { useState } from 'react';
import { Conversation, User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import Skeleton from '../common/Skeleton';

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

const ConversationList: React.FC<ConversationListProps> = ({ conversations, isLoading, currentUser, chukUser, userMap, activeConversationId, onSelectConversation, onNewMessage, unreadCounts, onClearConversation, onToggleBlock, onToggleAutoDelete, autoDeleteMap }) => {
  const chukConversation: Conversation = {
    id: chukUser.id,
    participants: [{ id: currentUser.id }, { id: chukUser.id }],
    lastMessage: 'Your personal guide & friend',
    timestamp: new Date().toISOString(),
    messages: []
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-4 backdrop-blur-md md:px-5">
        <div>
          <h2 className="text-[28px] font-bold font-display text-primary leading-[1.1]">Messages</h2>
          <p className="mt-1 text-sm text-secondary">Recent chats stay cached for quicker switching.</p>
        </div>
        <button onClick={onNewMessage} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:text-accent" aria-label="New Message">
          <PlusIcon />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-4">
        <ConversationItem
          conversation={chukConversation}
          otherParticipant={chukUser}
          isActive={chukConversation.id === activeConversationId}
          onSelect={onSelectConversation}
          unreadCount={0}
          isBlocked={false}
          isAutoDeleteEnabled={!!autoDeleteMap[chukUser.id]}
          onClearConversation={onClearConversation}
          onToggleBlock={onToggleBlock}
          onToggleAutoDelete={onToggleAutoDelete}
        />

        {isLoading && conversations.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-3 w-40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-10 text-center text-secondary">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background">✉️</div>
            <p>No user conversations yet.</p>
            <button onClick={onNewMessage} className="mt-3 text-sm font-semibold text-accent hover:underline">Start a new chat</button>
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

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, otherParticipant, isActive, onSelect, unreadCount, isBlocked, isAutoDeleteEnabled, onClearConversation, onToggleBlock, onToggleAutoDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`relative border-b border-border/70 px-3 py-2 sm:px-4 ${isActive ? 'bg-background/95' : 'hover:bg-background/70'}`}>
      <button onClick={() => onSelect(conversation)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition">
        <div className="relative flex-shrink-0">
          {otherParticipant.id === 'chuk-ai' ? (
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-background">
              <img src="/chuk-ai.png" alt="Psyduck AI" className="h-full w-full object-contain" />
            </div>
          ) : (
            <UserAvatar user={otherParticipant} className="h-12 w-12" />
          )}
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-text">{Math.min(unreadCount, 99)}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-primary">{otherParticipant.name}</p>
            <span className="shrink-0 text-[11px] text-secondary">{new Date(conversation.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
          <p className="truncate text-sm text-secondary">{conversation.lastMessage || 'Say hello 👋'}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-secondary">
            {isBlocked && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-400">Blocked</span>}
            {isAutoDeleteEnabled && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">24h auto-delete</span>}
          </div>
        </div>
      </button>
      {otherParticipant.id !== 'chuk-ai' && (
        <div className="absolute right-4 top-4">
          <button type="button" onClick={() => setIsMenuOpen(open => !open)} className="rounded-full p-2 text-secondary transition hover:bg-background hover:text-primary" aria-label="Conversation options">⋯</button>
          {isMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <button type="button" onClick={() => { onToggleAutoDelete(otherParticipant.id); setIsMenuOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-primary hover:bg-background">{isAutoDeleteEnabled ? 'Disable' : 'Enable'} auto-delete</button>
              <button type="button" onClick={() => { onClearConversation(otherParticipant.id); setIsMenuOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-primary hover:bg-background">Clear conversation</button>
              <button type="button" onClick={() => { onToggleBlock(otherParticipant.id); setIsMenuOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10">{isBlocked ? 'Unblock user' : 'Block user'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default ConversationList;
