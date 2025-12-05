
// import React from 'react';
// import { Conversation, User } from '../../types';
// import UserAvatar from '../common/UserAvatar';
// import { timeAgo } from '../../utils/dateUtils';

// interface ConversationListProps {
//   conversations: Conversation[];
//   currentUser: User;
//   chukUser: User;
//   userMap: Map<string, User>;
//   activeConversationId?: string;
//   onSelectConversation: (conversation: Conversation) => void;
//   onNewMessage: () => void;
//   unreadCounts: { [key: string]: number };
// }

// const ConversationList: React.FC<ConversationListProps> = ({ conversations, currentUser, chukUser, userMap, activeConversationId, onSelectConversation, onNewMessage, unreadCounts }) => {

//   const chukConversation: Conversation = {
//     id: chukUser.id,
//     participants: [{ id: currentUser.id }, { id: chukUser.id }],
//     lastMessage: "Your personal guide & friend",
//     timestamp: new Date().toISOString(), // This will not be displayed but good to have
//     messages: []
//   };

//   return (
//     <div className="h-full flex flex-col bg-surface">
//       <div className="p-4 border-b border-border flex-shrink-0 flex justify-between items-center">
//         <h2 className="text-xl font-bold font-display text-primary">Messages</h2>
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
        
//         {conversations.length === 0 && (
//             <div className="text-center p-8 text-secondary">
//                 <p>No user conversations yet.</p>
//                 <button onClick={onNewMessage} className="text-sm text-accent font-semibold hover:underline mt-2">
//                     Start a new chat!
//                 </button>
//             </div>
//         )}
//         {conversations.map(conv => {
//           const otherParticipantId = conv.participants.find(p => p.id !== currentUser.id)?.id;
//           if (!otherParticipantId) return null;

//           const otherParticipant = userMap.get(otherParticipantId);
//           if (!otherParticipant) return null;

//           const unreadCount = unreadCounts[otherParticipantId] || 0;
          
//           return (
//             <ConversationItem
//               key={conv.id}
//               conversation={conv}
//               otherParticipant={otherParticipant}
//               isActive={conv.id === activeConversationId}
//               onSelect={onSelectConversation}
//               unreadCount={unreadCount}
//             />
//           );
//         })}
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
//         <div className="flex justify-between items-center">
//             <p className={`font-semibold text-primary truncate ${unreadCount > 0 ? 'font-bold' : ''}`}>{otherParticipant.name}</p>
//             <div className="flex items-center space-x-2">
//                 <span className="text-xs text-secondary whitespace-nowrap">{timeAgo(conversation.timestamp)}</span>
//                 {unreadCount > 0 && (
//                     <span className="bg-accent text-accent-text text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
//                         {unreadCount > 9 ? '9+' : unreadCount}
//                     </span>
//                 )}
//             </div>
//         </div>
//         <p className={`text-sm truncate ${unreadCount > 0 ? 'text-primary font-semibold' : 'text-secondary'}`}>{conversation.lastMessage}</p>
//       </div>
//     </div>
// )

// const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

// export default ConversationList;
