






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
//     <div className="h-full flex flex-col bg-surface">
//       <div className="p-5 border-b border-border flex-shrink-0 flex justify-between items-center">
//         <h2 className="text-3xl font-bold font-display text-primary">Messages</h2>
//         <button onClick={onNewMessage} className="p-2 rounded-full text-primary bg-background border border-border hover:bg-accent hover:text-accent-text transition-colors" aria-label="New Message">
//             <PlusIcon />
//         </button>
//       </div>
//       <div className="overflow-y-auto flex-1">
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





import React from 'react';
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
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, isLoading, currentUser, chukUser, userMap, activeConversationId, onSelectConversation, onNewMessage, unreadCounts }) => {

  const chukConversation: Conversation = {
    id: chukUser.id,
    participants: [{ id: currentUser.id }, { id: chukUser.id }],
    lastMessage: "Your personal guide & friend",
    timestamp: new Date().toISOString(), // This will not be displayed but good to have
    messages: []
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="p-5 border-b border-border flex-shrink-0 flex justify-between items-center">
        <h2 className="text-3xl font-bold font-display text-primary">Messages</h2>
        <button onClick={onNewMessage} className="p-2 rounded-full text-primary bg-background border border-border hover:bg-accent hover:text-accent-text transition-colors" aria-label="New Message">
            <PlusIcon />
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
          {/* Chuk AI Static Conversation */}
          <ConversationItem
              key={chukConversation.id}
              conversation={chukConversation}
              otherParticipant={chukUser}
              isActive={chukConversation.id === activeConversationId}
              onSelect={onSelectConversation}
              unreadCount={0}
          />
        
        {isLoading ? (
            <div className="text-center p-8 text-secondary flex flex-col items-center">
                <img src="/kiss.gif" alt="Loading..." className="w-24 h-auto mb-2" />
                <p>Loading your chats...</p>
            </div>
        ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-secondary">
                <p>No user conversations yet.</p>
                <button onClick={onNewMessage} className="text-sm text-accent font-semibold hover:underline mt-2">
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
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, otherParticipant, isActive, onSelect, unreadCount }) => (
    <div
      onClick={() => onSelect(conversation)}
      className={`flex items-center p-4 cursor-pointer transition-colors border-b border-border ${
        isActive ? 'bg-background' : 'hover:bg-background'
      }`}
    >
        <div className="relative mr-4 flex-shrink-0">
            <UserAvatar user={otherParticipant} className="w-12 h-12" />
        </div>
      <div className="flex-1 overflow-hidden">
        <p className={`font-semibold text-primary`}>{otherParticipant.name}</p>
        <p className="text-sm text-secondary truncate">{conversation.lastMessage}</p>
      </div>
      {unreadCount > 0 && (
        <div className="ml-4 flex-shrink-0 w-6 h-6 bg-accent text-accent-text rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount}
        </div>
      )}
    </div>
)

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default ConversationList;