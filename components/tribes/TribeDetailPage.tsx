





// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { Tribe, User, TribeMessage } from '../../types';
// import UserAvatar from '../common/UserAvatar';
// import { useSocket } from '../../contexts/SocketContext';
// import TribeMembersModal from './TribeMembersModal';
// import * as api from '../../api'; // Assumed in root

// interface TribeDetailPageProps {
//   tribe: Tribe;
//   currentUser: User;
//   userMap: Map<string, User>;
//   onSendMessage: (tribeId: string, text: string, imageUrl?: string) => void;
//   onDeleteMessage: (tribeId: string, messageId: string) => void;
//   onDeleteTribe: (tribeId: string) => void;
//   onBack: () => void;
//   onViewProfile: (user: User) => void;
//   onEditTribe: (tribe: Tribe) => void;
//   onJoinToggle: (tribeId: string) => void;
// }

// const TribePlaceholderIcon = () => (
//      <div className="w-10 h-10 rounded-full mr-3 bg-background border border-border flex items-center justify-center text-secondary p-2">
//         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
//             <circle cx="9" cy="7" r="4"></circle>
//             <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
//             <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
//         </svg>
//     </div>
// );


// const TribeDetailPage: React.FC<TribeDetailPageProps> = (props) => {
//   const { tribe, currentUser, userMap, onSendMessage, onDeleteMessage, onDeleteTribe, onBack, onViewProfile, onEditTribe, onJoinToggle } = props;
//   const [inputText, setInputText] = useState('');
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);
//   const [isMembersModalOpen, setMembersModalOpen] = useState(false);

//   // Local state to handle optimistic updates AND fetched messages
//   const [localMessages, setLocalMessages] = useState<TribeMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const { socket, clearUnreadTribe } = useSocket();
//   const isMember = tribe.members.includes(currentUser.id);

//   // Fetch messages specifically for this tribe when opened
//   useEffect(() => {
//       const fetchHistory = async () => {
//           setIsLoading(true);
//           try {
//               const { data } = await api.fetchTribeMessages(tribe.id);
//               setLocalMessages(data);
//           } catch (error) {
//               console.error("Failed to load tribe chat history", error);
//           } finally {
//               setIsLoading(false);
//           }
//       };

//       // Load initially
//       fetchHistory();

//       // If the parent passes new messages (via socket in App.tsx), sync them, 
//       // but prioritize the fetch on mount to ensure we have history.
//       if (tribe.messages && tribe.messages.length > localMessages.length) {
//            setLocalMessages(prev => {
//                 // Determine new messages from props that aren't in local state
//                 const currentIds = new Set(prev.map(m => m.id));
//                 const newMsgs = tribe.messages.filter(m => !currentIds.has(m.id));
//                 return [...prev, ...newMsgs];
//            });
//       }
//   }, [tribe.id, tribe.messages]); // Re-run if tribe ID changes

//   useEffect(() => {
//     if (!isLoading) {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [localMessages, isLoading]);

//   useEffect(() => {
//     clearUnreadTribe(tribe.id);
//   }, [tribe.id, clearUnreadTribe]);

//   useEffect(() => {
//     if (!socket) return;
//     const handleTyping = ({ userName, userId }: { userName: string, userId: string }) => {
//         if (userId !== currentUser.id) {
//             setTypingUsers(prev => [...new Set([...prev, userName])]);
//         }
//     };
//     const handleStopTyping = ({ userName }: { userName: string }) => {
//         setTypingUsers(prev => prev.filter(name => name !== userName));
//     };
//     socket.on('userTyping', handleTyping);
//     socket.on('userStoppedTyping', handleStopTyping);

//     return () => {
//       socket.off('userTyping');
//       socket.off('userStoppedTyping');
//     };
//   }, [socket, currentUser.id]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInputText(e.target.value);
//     if (socket && isMember) {
//       if (!typingTimeoutRef.current) {
//         socket.emit('typing', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
//       }
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = setTimeout(() => {
//         socket.emit('stopTyping', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
//         typingTimeoutRef.current = null;
//       }, 2000);
//     }
//   };

//   const handleSendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (inputText.trim()) {
//         const textToSend = inputText;
//         setInputText('');

//         // Optimistic Update
//         const tempMessage: TribeMessage = {
//             id: `temp-${Date.now()}`,
//             tribeId: tribe.id,
//             sender: currentUser,
//             senderId: currentUser.id,
//             text: textToSend,
//             timestamp: new Date().toISOString(),
//         };

//         setLocalMessages(prev => [...prev, tempMessage]);

//         onSendMessage(tribe.id, textToSend);

//         if (socket) {
//             if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//             socket.emit('stopTyping', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
//             typingTimeoutRef.current = null;
//         }
//     }
//   };

//   const typingText = useMemo(() => {
//     const otherTypingUsers = typingUsers.filter(name => name !== currentUser.name);
//     if (otherTypingUsers.length === 0) return `${tribe.members.length} members`;
//     if (otherTypingUsers.length === 1) return `${otherTypingUsers[0]} is typing...`;
//     if (otherTypingUsers.length === 2) return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
//     return 'Several people are typing...';
//   }, [typingUsers, tribe.members.length, currentUser.name]);



// export default TribeDetailPage;






import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';
import TribeMembersModal from './TribeMembersModal';
import * as api from '../../api';

interface TribeDetailPageProps {
  tribe: Tribe;
  currentUser: User;
  userMap: Map<string, User>;
  onSendMessage: (tribeId: string, text: string, imageUrl?: string) => void;
  onDeleteMessage: (tribeId: string, messageId: string) => void;
  onDeleteTribe: (tribeId: string) => void;
  onBack: () => void;
  onViewProfile: (user: User) => void;
  onEditTribe: (tribe: Tribe) => void;
  onJoinToggle: (tribeId: string) => void;
  onKickMember: (tribeId: string, userId: string) => void;
}

const TribePlaceholderIcon = () => (
  <div className="w-10 h-10 rounded-full mr-3 bg-background border border-border flex items-center justify-center text-secondary p-2">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  </div>
);


const TribeDetailPage: React.FC<TribeDetailPageProps> = (props) => {
  const { tribe, currentUser, userMap, onSendMessage, onDeleteMessage, onDeleteTribe, onBack, onViewProfile, onEditTribe, onJoinToggle, onKickMember } = props;
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isMembersModalOpen, setMembersModalOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<TribeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, clearUnreadTribe } = useSocket();
  const isMember = tribe.members.includes(currentUser.id);

  // Fetch messages immediately on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.fetchTribeMessages(tribe.id);
        // Ensure data is array
        if (Array.isArray(data)) {
          setLocalMessages(data);
        }
      } catch (error) {
        console.error("Failed to load tribe messages", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [tribe.id]);

  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages, isLoading]);

  useEffect(() => {
    clearUnreadTribe(tribe.id);
  }, [tribe.id, clearUnreadTribe]);

  // Listen for new messages specifically for this tribe
  useEffect(() => {
    if (!socket) return;

    const handleNewTribeMessage = (message: TribeMessage) => {
      if (message.tribeId === tribe.id) {
        setLocalMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleTribeMessageDeleted = ({ tribeId, messageId }: { tribeId: string, messageId: string }) => {
      if (tribeId === tribe.id) {
        setLocalMessages(prev => prev.filter(m => m.id !== messageId));
      }
    };

    socket.on('newTribeMessage', handleNewTribeMessage);
    socket.on('tribeMessageDeleted', handleTribeMessageDeleted);

    // Also need typing listeners
    const handleTyping = ({ userName }: { userName: string }) => {
      setTypingUsers(prev => [...new Set([...prev, userName])]);
    };
    const handleStopTyping = ({ userName }: { userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== userName));
    };
    socket.on('userTyping', handleTyping);
    socket.on('userStoppedTyping', handleStopTyping);

    return () => {
      socket.off('newTribeMessage', handleNewTribeMessage);
      socket.off('tribeMessageDeleted', handleTribeMessageDeleted);
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket, tribe.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket && isMember) {
      if (!typingTimeoutRef.current) {
        socket.emit('typing', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      const textToSend = inputText;
      setInputText(''); // Clear input immediately

      // Optimistic Update
      const tempMessage: TribeMessage = {
        id: `temp-${Date.now()}`,
        tribeId: tribe.id,
        sender: currentUser,
        senderId: currentUser.id,
        text: textToSend,
        timestamp: new Date().toISOString(),
      };

      setLocalMessages(prev => [...prev, tempMessage]);

      // Send to backend
      onSendMessage(tribe.id, textToSend);

      if (socket) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { roomId: `tribe-${tribe.id}`, userName: currentUser.name, userId: currentUser.id });
        typingTimeoutRef.current = null;
      }
    }
  };

  const typingText = useMemo(() => {
    const otherTypingUsers = typingUsers.filter(name => name !== currentUser.name);
    if (otherTypingUsers.length === 0) return `${tribe.members.length} members`;
    if (otherTypingUsers.length === 1) return `${otherTypingUsers[0]} is typing...`;
    if (otherTypingUsers.length === 2) return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
    return 'Several people are typing...';
  }, [typingUsers, tribe.members.length, currentUser.name]);

  const handleViewProfileFromModal = (user: User) => {
    onViewProfile(user);
    setMembersModalOpen(false);
  }

  return (
    <>
      <div className="flex flex-col h-full bg-surface border border-border shadow-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-3 border-b border-border flex-shrink-0">
          <button onClick={onBack} className="p-2 mr-2 text-primary">
            <BackIcon />
          </button>
          {tribe.avatarUrl ? (
            <img src={tribe.avatarUrl} alt={tribe.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
          ) : (
            <TribePlaceholderIcon />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-primary truncate">{tribe.name}</h2>
            <button onClick={() => setMembersModalOpen(true)} className={`text-sm truncate text-left hover:underline ${typingUsers.length > 0 && typingUsers.some(u => u !== currentUser.name) ? 'text-accent italic' : 'text-secondary'}`}>
              {typingText}
            </button>
          </div>
          <div className="ml-auto flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {currentUser.id === tribe.owner && (
              <>
                <button
                  onClick={() => onEditTribe(tribe)}
                  className="p-2 text-secondary hover:text-primary rounded-full hover:bg-background"
                  aria-label="Edit Tribe"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => onDeleteTribe(tribe.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                  aria-label="Delete Tribe"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-background">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <img src="/busstop.gif" alt="Loading chats..." className="w-32 h-auto mb-4" />
              <p className="text-secondary text-sm">Loading conversations...</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {localMessages.map(message => {
                // Ensure we check ID robustly (handle object vs string)
                const msgSenderId = typeof message.senderId === 'string' ? message.senderId : message.sender?.id;
                // If sender object exists, use its ID, otherwise use senderId string
                const actualSenderId = message.sender?.id || msgSenderId;
                const isCurrentUser = String(actualSenderId) === String(currentUser.id);

                // Get sender details: Prioritize the 'sender' object (populated by backend)
                // If not available, check userMap, otherwise fall back to a safe object.
                const sender = message.sender && message.sender.name ? message.sender : (userMap.get(actualSenderId || '') || { name: 'Anonymous', avatarUrl: null, id: 'unknown', username: 'unknown' });

                return (
                  <div key={message.id} className={`flex items-end gap-2.5 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && (
                      <div
                        className="w-8 h-8 rounded-full cursor-pointer self-start flex-shrink-0"
                        onClick={() => sender.id !== 'unknown' && onViewProfile(sender as User)}
                      >
                        <UserAvatar user={sender as User} className="w-full h-full" />
                      </div>
                    )}
                    {isCurrentUser && (
                      <button onClick={() => onDeleteMessage(tribe.id, message.id)} className="text-secondary p-1 rounded-full hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                    <div className={`flex flex-col w-full max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {!isCurrentUser && (
                        <p
                          className="text-xs text-secondary mb-1 ml-3 cursor-pointer hover:underline"
                          onClick={() => sender.id !== 'unknown' && onViewProfile(sender as User)}
                        >
                          {sender.name}
                        </p>
                      )}
                      <div className={`px-4 py-2.5 text-sm break-words ${isCurrentUser ? 'bg-accent text-accent-text rounded-2xl rounded-tr-none' : 'bg-surface text-primary shadow-sm rounded-2xl rounded-tl-none'}`}>
                        {message.imageUrl && (
                          <img src={message.imageUrl} alt="Shared content" className="mb-2 rounded-lg w-full" />
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      </div>
                      <p className="text-xs text-secondary mt-1.5 px-1">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
              {localMessages.length === 0 && (
                <div className="text-center text-secondary p-8">
                  <p>Welcome to #{tribe.name}!</p>
                  <p className="text-sm">Be the first one to send a message.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-surface flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isMember ? `Message #${tribe.name}` : "You must be a member to chat"}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0"
              disabled={!isMember}
            />
            <button type="submit" className="bg-accent text-accent-text rounded-lg w-12 h-11 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!inputText.trim() || !isMember}>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
      {isMembersModalOpen && (
        <TribeMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setMembersModalOpen(false)}
          memberIds={tribe.members}
          userMap={userMap}
          onViewProfile={handleViewProfileFromModal}
          currentUser={currentUser}
          tribeOwnerId={tribe.owner}
          onKickMember={(userId) => onKickMember(tribe.id, userId)}
        />
      )}
    </>
  );
};

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const TrashIcon = ({ className = 'h-5 w-5' }: { className?: string; }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


export default TribeDetailPage;
