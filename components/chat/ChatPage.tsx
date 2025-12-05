



// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Conversation, User, Message, Post } from '../../types';
// import ConversationList from './ConversationList';
// import { MessageArea } from './MessageArea';
// import NewMessageModal from './NewMessageModal';
// import * as api from '../../api.ts';
// import { useSocket } from '../../contexts/SocketContext';

// interface ChatPageProps {
//   currentUser: User;
//   allUsers: User[];
//   chukUser: User;
//   initialTargetUser: User | null;
//   onViewProfile: (user: User) => void;
//   onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
// }

// const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers, chukUser, initialTargetUser, onViewProfile }) => {
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [isLoadingConversations, setIsLoadingConversations] = useState(true);
//   const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);
//   const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const { socket, onlineUsers, clearUnreadMessages, unreadCounts, setActiveChatPartnerId } = useSocket();

//   const userMap = useMemo(() => {
//       const map = new Map(allUsers.map(user => [user.id, user]));
//       map.set(chukUser.id, chukUser);
//       return map;
//   }, [allUsers, chukUser]);

//   const fetchConversations = useCallback(async () => {
//       setIsLoadingConversations(true);
//       try {
//         const { data } = await api.fetchConversations();
//         setConversations(data);
//         return data;
//       } catch (error) {
//         console.error("Failed to fetch conversations", error);
//         return [];
//       } finally {
//         setIsLoadingConversations(false);
//       }
//   }, []);

//   useEffect(() => {
//     fetchConversations();
//   }, [fetchConversations]);
  
//   // Listen for new messages via socket
//   useEffect(() => {
//     if (!socket) return;
    
//     const handleNewMessage = (message: Message) => {
//         const isActiveConversation = (activeConversation?.participants.some(p => p.id === message.senderId) && activeConversation?.participants.some(p => p.id === message.receiverId));

//         if (isActiveConversation) {
//             setMessages(prev => [...prev, message]);
//         }
        
//         setConversations(prev => {
//             const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
//             const convoIndex = prev.findIndex(c => c.participants.some(p => p.id === otherUserId));
            
//             if (convoIndex > -1) {
//                 const updatedConvo = { ...prev[convoIndex], lastMessage: message.text, timestamp: message.timestamp };
//                 const restConvos = [...prev.slice(0, convoIndex), ...prev.slice(convoIndex + 1)];
//                 return [updatedConvo, ...restConvos];
//             } else {
//                 const newConvo = { id: `conv-${otherUserId}`, participants: [{ id: currentUser.id }, { id: otherUserId }], lastMessage: message.text, timestamp: message.timestamp, messages: [] };
//                 return [newConvo, ...prev];
//             }
//         });
//     };

//     socket.on('newMessage', handleNewMessage);
    
//     return () => {
//       socket.off('newMessage', handleNewMessage);
//     };
//   }, [socket, activeConversation, currentUser.id]);


//   const handleSelectConversation = useCallback(async (conv: Conversation) => {
//     setActiveConversation(conv);
//     setIsLoadingMessages(true);

//     const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
//     if (!otherUserId) {
//         setIsLoadingMessages(false);
//         return;
//     }
    
//     setActiveChatPartnerId(otherUserId);
//     clearUnreadMessages(otherUserId);
//     socket?.emit('joinRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);

//     if (otherUserId === chukUser.id) {
//         setMessages([{ id: 'chuk-intro', senderId: chukUser.id, receiverId: currentUser.id, text: `Hi ${currentUser.name.split(' ')[0]}! I'm Chuk, your new best friend at Tribe! What's on your mind? 🐣`, timestamp: new Date().toISOString() }]);
//         setMessageAreaVisible(true);
//         setIsLoadingMessages(false);
//         return;
//     }

//     try {
//         const { data } = await api.fetchMessages(otherUserId);
//         setMessages(data);
//         setMessageAreaVisible(true);
//     } catch (error) {
//         console.error("Failed to fetch messages", error);
//         setMessages([]);
//     } finally {
//         setIsLoadingMessages(false);
//     }
//   }, [currentUser.id, currentUser.name, chukUser.id, socket, clearUnreadMessages, setActiveChatPartnerId]);
  
//   const handleStartNewConversation = useCallback((targetUser: User) => {
//     if (targetUser.id === chukUser.id) {
//         handleSelectConversation({ id: chukUser.id, participants: [{id: currentUser.id}, {id: chukUser.id}], lastMessage: "AI Assistant", timestamp: new Date().toISOString(), messages: [] });
//         return;
//     }

//     const existingConvo = conversations.find(c => c.participants.some(p => p.id === targetUser.id));
//     if (existingConvo) {
//       handleSelectConversation(existingConvo);
//     } else {
//       const tempConvo: Conversation = { id: `temp-${targetUser.id}`, participants: [{ id: currentUser.id }, { id: targetUser.id }], messages: [], lastMessage: `Start a conversation with ${targetUser.name}`, timestamp: new Date().toISOString() };
//       setActiveConversation(tempConvo);
//       setMessages([]);
//       setMessageAreaVisible(true);
//       socket?.emit('joinRoom', `dm-${[currentUser.id, targetUser.id].sort().join('-')}`);
//     }
//   }, [conversations, currentUser.id, handleSelectConversation, chukUser.id, socket]);
  
//   useEffect(() => {
//     if (initialTargetUser) {
//         handleStartNewConversation(initialTargetUser);
//     }
//   }, [initialTargetUser, handleStartNewConversation]);

//   const handleBackToList = () => {
//     if (activeConversation) {
//       const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
//       if (otherUserId) socket?.emit('leaveRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
//     }
//     setActiveChatPartnerId(null);
//     setActiveConversation(null);
//     setMessageAreaVisible(false);
//   };

//   const handleSendMessage = async (text: string) => {
//     if (!activeConversation || isSending) return;
//     setIsSending(true);
//     const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
//     if (!otherUserId) {
//         setIsSending(false);
//         return;
//     }
//     const tempMessage: Message = { id: `temp-${Date.now()}`, senderId: currentUser.id, receiverId: otherUserId, text, timestamp: new Date().toISOString() };
//     setMessages(prev => [...prev, tempMessage]);

//     if (otherUserId === chukUser.id) {
//         try {
//             const { data } = await api.generateAiChat({ prompt: text });
//             const chukResponse: Message = { id: `chuk-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: data.text, timestamp: new Date().toISOString() };
//             setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, chukResponse]);
//         } catch (error) {
//             console.error("Chuk AI Error:", error);
//             const errorMessage: Message = { id: `chuk-err-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: "Chirp chirp... I'm having a little trouble thinking right now. Please try again in a moment! 🐣", timestamp: new Date().toISOString() };
//             setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, errorMessage]);
//         } finally {
//             setIsSending(false);
//         }
//         return;
//     }

//     try {
//         await api.sendMessage(otherUserId, { message: text });
//         if(activeConversation.id.startsWith('temp-')){
//             const newConversations = await fetchConversations();
//             const newConvo = newConversations.find((c: Conversation) => c.participants.some(p => p.id === otherUserId));
//             if (newConvo) setActiveConversation(newConvo);
//         }
//     } catch (error) {
//         console.error("Failed to send message", error);
//         setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
//     } finally {
//         setIsSending(false);
//     }
//   };
  
//   return (
//     <div className="h-full bg-surface md:rounded-2xl md:border md:border-border md:shadow-lg flex overflow-hidden relative">
//        <div 
//         className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 z-10 md:border-r md:border-border bg-surface ${
//           isMessageAreaVisible ? '-translate-x-full' : 'translate-x-0'
//         } md:translate-x-0`}
//       >
//         <ConversationList conversations={conversations} isLoading={isLoadingConversations} currentUser={currentUser} chukUser={chukUser} userMap={userMap} activeConversationId={activeConversation?.id} onSelectConversation={handleSelectConversation} onNewMessage={() => setNewMessageModalOpen(true)} unreadCounts={unreadCounts.messages} />
//       </div>
      
//       <div 
//         className={`w-full md:flex-1 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 bg-background ${
//             isMessageAreaVisible ? 'translate-x-0' : 'translate-x-full'
//         } md:translate-x-0`}
//         >
//         {activeConversation ? (
//             <MessageArea key={activeConversation.id} conversation={activeConversation} messages={messages} isLoading={isLoadingMessages} currentUser={currentUser} userMap={userMap} isSending={isSending} onSendMessage={handleSendMessage} onBack={handleBackToList} onViewProfile={onViewProfile} />
//         ) : (
//             <div className="hidden md:flex w-full h-full flex-col items-center justify-center text-center p-8">
//                 <div className="w-24 h-24 text-secondary mb-4">
//                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
//                 </div>
//                 <h2 className="text-2xl font-bold text-primary font-display">Your Messages</h2>
//                 <p className="text-secondary mt-2">Select a conversation or start a new one.</p>
//             </div>
//         )}
//        </div>
//        {isNewMessageModalOpen && (
//            <NewMessageModal allUsers={allUsers.filter(u => u.id !== currentUser.id)} onClose={() => setNewMessageModalOpen(false)} onUserSelect={(user) => { setNewMessageModalOpen(false); handleStartNewConversation(user); }} />
//        )}
//     </div>
//   );
// };

// export default ChatPage;






import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation, User, Message, Post } from '../../types';
import ConversationList from './ConversationList';
import { MessageArea } from './MessageArea';
import NewMessageModal from './NewMessageModal';
import * as api from '../../api.ts';
import { useSocket } from '../../contexts/SocketContext';

interface ChatPageProps {
  currentUser: User;
  allUsers: User[];
  chukUser: User;
  initialTargetUser: User | null;
  onViewProfile: (user: User) => void;
  onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers, chukUser, initialTargetUser, onViewProfile }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);
  const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { socket, onlineUsers, clearUnreadMessages, unreadCounts, setActiveChatPartnerId } = useSocket();

  useEffect(() => {
    // When ChatPage is unmounted (e.g., user navigates away),
    // ensure we clear the active chat partner ID so notifications resume correctly.
    return () => {
      setActiveChatPartnerId(null);
    };
  }, [setActiveChatPartnerId]);

  const userMap = useMemo(() => {
      const map = new Map(allUsers.map(user => [user.id, user]));
      map.set(chukUser.id, chukUser);
      return map;
  }, [allUsers, chukUser]);

  const fetchConversations = useCallback(async () => {
      setIsLoadingConversations(true);
      try {
        const { data } = await api.fetchConversations();
        setConversations(data);
        return data;
      } catch (error) {
        console.error("Failed to fetch conversations", error);
        return [];
      } finally {
        setIsLoadingConversations(false);
      }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (message: Message) => {
        const isActiveConversation = (activeConversation?.participants.some(p => p.id === message.senderId) && activeConversation?.participants.some(p => p.id === message.receiverId));

        if (isActiveConversation) {
            setMessages(prev => [...prev, message]);
        }
        
        setConversations(prev => {
            const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
            const convoIndex = prev.findIndex(c => c.participants.some(p => p.id === otherUserId));
            
            if (convoIndex > -1) {
                const updatedConvo = { ...prev[convoIndex], lastMessage: message.text, timestamp: message.timestamp };
                const restConvos = [...prev.slice(0, convoIndex), ...prev.slice(convoIndex + 1)];
                return [updatedConvo, ...restConvos];
            } else {
                const newConvo = { id: `conv-${otherUserId}`, participants: [{ id: currentUser.id }, { id: otherUserId }], lastMessage: message.text, timestamp: message.timestamp, messages: [] };
                return [newConvo, ...prev];
            }
        });
    };

    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, activeConversation, currentUser.id]);


  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    setIsLoadingMessages(true);

    const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) {
        setIsLoadingMessages(false);
        return;
    }
    
    setActiveChatPartnerId(otherUserId);
    clearUnreadMessages(otherUserId);
    socket?.emit('joinRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);

    if (otherUserId === chukUser.id) {
        setMessages([{ id: 'chuk-intro', senderId: chukUser.id, receiverId: currentUser.id, text: `Hi ${currentUser.name.split(' ')[0]}! I'm Chuk, your new best friend at Tribe! What's on your mind? 🐣`, timestamp: new Date().toISOString() }]);
        setMessageAreaVisible(true);
        setIsLoadingMessages(false);
        return;
    }

    try {
        const { data } = await api.fetchMessages(otherUserId);
        setMessages(data);
        setMessageAreaVisible(true);
    } catch (error) {
        console.error("Failed to fetch messages", error);
        setMessages([]);
    } finally {
        setIsLoadingMessages(false);
    }
  }, [currentUser.id, currentUser.name, chukUser.id, socket, clearUnreadMessages, setActiveChatPartnerId]);
  
  const handleStartNewConversation = useCallback((targetUser: User) => {
    if (targetUser.id === chukUser.id) {
        handleSelectConversation({ id: chukUser.id, participants: [{id: currentUser.id}, {id: chukUser.id}], lastMessage: "AI Assistant", timestamp: new Date().toISOString(), messages: [] });
        return;
    }

    const existingConvo = conversations.find(c => c.participants.some(p => p.id === targetUser.id));
    if (existingConvo) {
      handleSelectConversation(existingConvo);
    } else {
      const tempConvo: Conversation = { id: `temp-${targetUser.id}`, participants: [{ id: currentUser.id }, { id: targetUser.id }], messages: [], lastMessage: `Start a conversation with ${targetUser.name}`, timestamp: new Date().toISOString() };
      setActiveConversation(tempConvo);
      setMessages([]);
      setMessageAreaVisible(true);
      socket?.emit('joinRoom', `dm-${[currentUser.id, targetUser.id].sort().join('-')}`);
    }
  }, [conversations, currentUser.id, handleSelectConversation, chukUser.id, socket]);
  
  useEffect(() => {
    if (initialTargetUser) {
        handleStartNewConversation(initialTargetUser);
    }
  }, [initialTargetUser, handleStartNewConversation]);

  const handleBackToList = () => {
    if (activeConversation) {
      const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
      if (otherUserId) socket?.emit('leaveRoom', `dm-${[currentUser.id, otherUserId].sort().join('-')}`);
    }
    setActiveChatPartnerId(null);
    setActiveConversation(null);
    setMessageAreaVisible(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation || isSending) return;
    setIsSending(true);
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) {
        setIsSending(false);
        return;
    }
    const tempMessage: Message = { id: `temp-${Date.now()}`, senderId: currentUser.id, receiverId: otherUserId, text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMessage]);

    if (otherUserId === chukUser.id) {
        try {
            const { data } = await api.generateAiChat({ prompt: text });
            const chukResponse: Message = { id: `chuk-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: data.text, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, chukResponse]);
        } catch (error) {
            console.error("Chuk AI Error:", error);
            const errorMessage: Message = { id: `chuk-err-${Date.now()}`, senderId: chukUser.id, receiverId: currentUser.id, text: "Chirp chirp... I'm having a little trouble thinking right now. Please try again in a moment! 🐣", timestamp: new Date().toISOString() };
            setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), tempMessage, errorMessage]);
        } finally {
            setIsSending(false);
        }
        return;
    }

    try {
        await api.sendMessage(otherUserId, { message: text });
        if(activeConversation.id.startsWith('temp-')){
            const newConversations = await fetchConversations();
            const newConvo = newConversations.find((c: Conversation) => c.participants.some(p => p.id === otherUserId));
            if (newConvo) setActiveConversation(newConvo);
        }
    } catch (error) {
        console.error("Failed to send message", error);
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
        setIsSending(false);
    }
  };
  
  return (
    <div className="h-full bg-surface md:rounded-2xl md:border md:border-border md:shadow-lg flex overflow-hidden relative">
       <div 
        className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 z-10 md:border-r md:border-border bg-surface ${
          isMessageAreaVisible ? '-translate-x-full' : 'translate-x-0'
        } md:translate-x-0`}
      >
        <ConversationList conversations={conversations} isLoading={isLoadingConversations} currentUser={currentUser} chukUser={chukUser} userMap={userMap} activeConversationId={activeConversation?.id} onSelectConversation={handleSelectConversation} onNewMessage={() => setNewMessageModalOpen(true)} unreadCounts={unreadCounts.messages} />
      </div>
      
      <div 
        className={`w-full md:flex-1 flex flex-col transition-transform duration-300 ease-in-out md:static absolute inset-0 bg-background ${
            isMessageAreaVisible ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
        >
        {activeConversation ? (
            <MessageArea key={activeConversation.id} conversation={activeConversation} messages={messages} isLoading={isLoadingMessages} currentUser={currentUser} userMap={userMap} isSending={isSending} onSendMessage={handleSendMessage} onBack={handleBackToList} onViewProfile={onViewProfile} />
        ) : (
            <div className="hidden md:flex w-full h-full flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 text-secondary mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-primary font-display">Your Messages</h2>
                <p className="text-secondary mt-2">Select a conversation or start a new one.</p>
            </div>
        )}
       </div>
       {isNewMessageModalOpen && (
           <NewMessageModal allUsers={allUsers.filter(u => u.id !== currentUser.id)} onClose={() => setNewMessageModalOpen(false)} onUserSelect={(user) => { setNewMessageModalOpen(false); handleStartNewConversation(user); }} />
       )}
    </div>
  );
};

export default ChatPage;