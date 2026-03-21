






// import React from 'react';
// import { Conversation, User } from '../../types';
// import UserAvatar from '../common/UserAvatar';

// interface ConversationListProps {
//   conversations: Conversation[];
//   isLoading: boolean;
//   currentUser: User;
//   chukUser: User;
//   userMap: Map<string, User>;
//   activeConversationId?: string;
//   onSelectConversation: (conversation: Conversation) => void;
//   onNewMessage: () => void;
//   unreadCounts: { [key: string]: number };
// }

// const ConversationList: React.FC<ConversationListProps> = ({ conversations, isLoading, currentUser, chukUser, userMap, activeConversationId, onSelectConversation, onNewMessage, unreadCounts }) => {

//   const chukConversation: Conversation = {
//     id: chukUser.id,
//     participants: [{ id: currentUser.id }, { id: chukUser.id }],
//     lastMessage: "Your personal guide & friend",
//     timestamp: new Date().toISOString(), // This will not be displayed but good to have
//     messages: []
//   };

//   return (
//     <div className="h-full min-h-0 flex flex-col bg-surface">
//       <div className="sticky top-0 z-10 p-5 border-b border-border bg-surface flex-shrink-0 flex justify-between items-center">
//         <h2 className="text-3xl font-bold font-display text-primary">Messages</h2>
//         <button onClick={onNewMessage} className="p-2 rounded-full text-primary bg-background border border-border hover:bg-accent hover:text-accent-text transition-colors" aria-label="New Message">
//             <PlusIcon />
//         </button>
//       </div>
//       <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
//           {/* Chuk AI Static Conversation */}
//           <ConversationItem
//               key={chukConversation.id}
//               conversation={chukConversation}
//               otherParticipant={chukUser}
//               isActive={chukConversation.id === activeConversationId}
//               onSelect={onSelectConversation}
//               unreadCount={0}
//           />

//         {isLoading ? (
//             <div className="text-center p-8 text-secondary flex flex-col items-center">
//                 <img src="/kiss.gif" alt="Loading..." className="w-16 h-16 mb-2" />
//                 <p>Loading your chats...</p>
//             </div>
//         ) : conversations.length === 0 ? (
//             <div className="text-center p-8 text-secondary">
//                 <p>No user conversations yet.</p>
//                 <button onClick={onNewMessage} className="text-sm text-accent font-semibold hover:underline mt-2">
//                     Start a new chat!
//                 </button>
//             </div>
//         ) : (
//             conversations.map(conv => {
//               const otherParticipantId = conv.participants.find(p => p.id !== currentUser.id)?.id;
//               if (!otherParticipantId) return null;

//               const otherParticipant = userMap.get(otherParticipantId);
//               if (!otherParticipant) return null;

//               return (
//                 <ConversationItem
//                   key={conv.id}
//                   conversation={conv}
//                   otherParticipant={otherParticipant}
//                   isActive={conv.id === activeConversationId}
//                   onSelect={onSelectConversation}
//                   unreadCount={unreadCounts[otherParticipantId] || 0}
//                 />
//               );
//             })
//         )}
//       </div>
//     </div>
//   );
// };

// interface ConversationItemProps {
//     conversation: Conversation;
//     otherParticipant: User;
//     isActive: boolean;
//     onSelect: (conv: Conversation) => void;
//     unreadCount: number;
// }

// const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, otherParticipant, isActive, onSelect, unreadCount }) => (
//     <div
//       onClick={() => onSelect(conversation)}
//       className={`flex items-center p-4 cursor-pointer transition-colors border-b border-border ${
//         isActive ? 'bg-background' : 'hover:bg-background'
//       }`}
//     >
//         <div className="relative mr-4 flex-shrink-0">
//             <UserAvatar user={otherParticipant} className="w-12 h-12" />
//         </div>
//       <div className="flex-1 overflow-hidden">
//         <p className={`font-semibold text-primary`}>{otherParticipant.name}</p>
//         <p className="text-sm text-secondary truncate">{conversation.lastMessage}</p>
//       </div>
//       {unreadCount > 0 && (
//         <div className="ml-4 flex-shrink-0 w-6 h-6 bg-accent text-accent-text rounded-full flex items-center justify-center text-xs font-bold">
//             {unreadCount}
//         </div>
//       )}
//     </div>
// )

// const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

// export default ConversationList;





import React, { useMemo, useState } from 'react';
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

const ConversationList: React.FC<ConversationListProps> = ({ conversations, isLoading, currentUser, chukUser, userMap, activeConversationId, onSelectConversation, onNewMessage, unreadCounts, onClearConversation, onToggleBlock, onToggleAutoDelete, autoDeleteMap }) => {

  const dedupedConversations = useMemo(() => {
    const byConversationId = new Map<string, Conversation>();

    conversations.forEach((conversation) => {
      if (!conversation?.id) return;
      const existing = byConversationId.get(conversation.id);

      if (!existing) {
        byConversationId.set(conversation.id, conversation);
        return;
      }

      const currentTime = new Date(conversation.timestamp || 0).getTime();
      const existingTime = new Date(existing.timestamp || 0).getTime();
      if (currentTime >= existingTime) {
        byConversationId.set(conversation.id, conversation);
      }
    });

    return Array.from(byConversationId.values());
  }, [conversations]);

  const chukConversation: Conversation = {
    id: chukUser.id,
    participants: [{ id: currentUser.id }, { id: chukUser.id }],
    lastMessage: "Your personal guide & friend",
    timestamp: new Date().toISOString(), // This will not be displayed but good to have
    messages: []
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface">
      <div className="sticky top-0 z-20 p-4 sm:p-5 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-3xl font-bold font-display text-primary">Messages</h2>
        <button onClick={onNewMessage} className="p-2 rounded-full text-primary bg-background border border-border hover:bg-accent hover:text-accent-text transition-colors" aria-label="New Message">
          <PlusIcon />
        </button>
      </div>
      <div
        className="overflow-y-auto flex-1 min-h-0 overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4"
      >
        {/* Chuk AI Static Conversation */}
        <ConversationItem
          key={chukConversation.id}
          conversation={chukConversation}
          otherParticipant={chukUser}
          isActive={chukConversation.id === activeConversationId}
          onSelect={onSelectConversation}
          unreadCount={0}
          isBlocked={false}
          isAutoDeleteEnabled={false}
          onClearConversation={() => { }}
          onToggleBlock={() => { }}
          onToggleAutoDelete={() => { }}
        />

        {isLoading ? (
          <div className="text-center p-8 text-secondary flex flex-col items-center">
            <img src="/busstop.gif" alt="Loading..." className="w-24 h-auto mb-2" />
            <p>Loading your chats...</p>
          </div>
        ) : dedupedConversations.length === 0 ? (
          <div className="text-center p-8 text-secondary">
            <p>No user conversations yet.</p>
            <button onClick={onNewMessage} className="text-sm text-accent font-semibold hover:underline mt-2">
              Start a new chat!
            </button>
          </div>
        ) : (
          dedupedConversations.map(conv => {
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
    </div >
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
      className={`relative flex items-center p-4 cursor-pointer transition-colors border-b border-border ${isActive ? 'bg-background' : 'hover:bg-background'
        }`}
    >
      <div className="relative mr-4 flex-shrink-0">
        <UserAvatar user={otherParticipant} className="w-12 h-12" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-semibold text-primary">{otherParticipant.name || otherParticipant.username}</p>
        <p className="text-sm text-secondary truncate">{sanitizeConversationSnippet(conversation.lastMessage)}</p>
      </div>
      {unreadCount > 0 && (
        <div className="ml-4 flex-shrink-0 w-6 h-6 bg-accent text-accent-text rounded-full flex items-center justify-center text-xs font-bold">
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
        className="ml-3 p-2 text-secondary hover:text-primary rounded-full hover:bg-background"
      >
        <MoreIcon />
      </button>
      {isMenuOpen && (
        <div
          className="absolute right-3 top-14 z-20 w-48 rounded-lg border border-border bg-surface shadow-lg overflow-hidden"
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

const sanitizeConversationSnippet = (text: string) => {
  if (!text) return 'No messages yet';
  if (text.includes('/post/undefined')) return 'Shared a post';
  return text;
};

export default ConversationList;
