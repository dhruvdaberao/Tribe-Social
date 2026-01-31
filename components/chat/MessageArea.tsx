

// import React, { useState, useRef, useEffect } from 'react';
// import { Conversation, User, Message } from '../../types';
// import UserAvatar from '../common/UserAvatar';
import ChatInput from './ChatInput';
// import { useSocket } from '../../contexts/SocketContext';
// import MarkdownRenderer from '../common/MarkdownRenderer';

// interface MessageAreaProps {
//   conversation: Conversation;
//   messages: Message[];
//   isLoading: boolean;
//   currentUser: User;
//   userMap: Map<string, User>;
//   isSending: boolean;
//   onSendMessage: (text: string) => void;
//   onBack: () => void;
//   onViewProfile: (user: User) => void;
// }

// export const MessageArea: React.FC<MessageAreaProps> = ({ conversation, messages, isLoading, currentUser, userMap, isSending, onSendMessage, onBack, onViewProfile }) => {
//   const [inputText, setInputText] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const otherParticipantId = conversation.participants.find(p => p.id !== currentUser.id)?.id;
//   const otherParticipant = otherParticipantId ? userMap.get(otherParticipantId) : null;
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const { socket, onlineUsers } = useSocket();

//   const isOtherUserOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false;

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, isLoading]);

//   useEffect(() => {
//     if (!socket) return;
//     const handleTyping = ({ userId }: { userId: string }) => {
//       if (userId === otherParticipantId) setIsTyping(true);
//     };
//     const handleStopTyping = ({ userId }: { userId: string }) => {
//        if (userId === otherParticipantId) setIsTyping(false);
//     };
//     socket.on('userTyping', handleTyping);
//     socket.on('userStoppedTyping', handleStopTyping);

//     return () => {
//       socket.off('userTyping', handleTyping);
//       socket.off('userStoppedTyping', handleStopTyping);
//     };
//   }, [socket, otherParticipantId]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInputText(e.target.value);
//     if (socket && otherParticipantId) {
//       if (!typingTimeoutRef.current) {
//         // FIX: Added 'userName' to the 'typing' event payload to match server expectations.
//         socket.emit('typing', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
//       }
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = setTimeout(() => {
//         // FIX: Added 'userName' to the 'stopTyping' event payload to match server expectations.
//         socket.emit('stopTyping', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
//         typingTimeoutRef.current = null;
//       }, 2000);
//     }
//   };

//   const handleSendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (inputText.trim()) {
//       onSendMessage(inputText);
//       setInputText('');
//       if (socket && otherParticipantId) {
//         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//         // FIX: Added 'userName' to the 'stopTyping' event payload to match server expectations.
//         socket.emit('stopTyping', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
//         typingTimeoutRef.current = null;
//       }
//     }
//   };

//   if (!otherParticipant) {
//       return (
//           <div className="flex flex-col h-full bg-surface">
//               <div className="flex items-center p-3 border-b border-border flex-shrink-0">
//                   <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
//                       <BackIcon />
//                   </button>
//                   <h2 className="text-lg font-bold text-primary">Error</h2>
//               </div>
//               <div className="flex-1 flex items-center justify-center p-4 text-center">
//                   <p className="text-secondary">Could not load conversation. The user may no longer exist.</p>
//               </div>
//           </div>
//       );
//   }

//   return (
//     <div className="flex flex-col h-full bg-background">
//       <div className="flex items-center p-3 border-b border-border bg-surface flex-shrink-0 z-10">
//         <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
//             <BackIcon />
//         </button>
//         <div 
//             className="flex items-center cursor-pointer overflow-hidden"
//             onClick={() => onViewProfile(otherParticipant)}
//         >
//             <UserAvatar user={otherParticipant} className="w-10 h-10 rounded-full mr-3 flex-shrink-0" isOnline={isOtherUserOnline} />
//             <div className="min-w-0">
//                 <h2 className="text-lg font-bold text-primary leading-tight hover:underline truncate">{otherParticipant.name}</h2>
//                  {isTyping ? (
//                     <p className="text-sm text-accent leading-tight truncate italic">typing...</p>
//                  ) : (
//                     <p className="text-sm text-secondary leading-tight truncate">@{otherParticipant.username}</p>
//                  )}
//             </div>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto p-4">
//         {isLoading ? (
//             <div className="w-full h-full flex items-center justify-center">
//                 <img src="/duckload.gif" alt="Loading messages..." className="w-16 h-16" />
//             </div>
//         ) : (
//             <div className="flex flex-col space-y-2">
//             {messages.map(message => {
//                 const isCurrentUser = message.senderId === currentUser.id;
//                 const sender = isCurrentUser ? currentUser : userMap.get(message.senderId);
//                 const sentAt = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
//                 return (
//                 <div key={message.id} className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
//                     {!isCurrentUser && (
//                         <div className="w-8 h-8 rounded-full flex-shrink-0 self-start">
//                         <UserAvatar user={sender || null} />
//                         </div>
//                     )}
//                     <div className={`flex flex-col w-full max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
//                         <div className={`px-4 py-2.5 rounded-xl ${isCurrentUser ? 'bg-accent text-accent-text' : 'bg-surface text-primary shadow-sm'}`}>
//                             {message.imageUrl && <img src={message.imageUrl} alt="Shared content" className="mb-2 rounded-lg w-full" />}
//                             <div className="text-sm leading-relaxed">
//                                 {sender?.id === 'chuk-ai' ? (
//                                     <MarkdownRenderer text={message.text} />
//                                 ) : (
//                                     <p className="whitespace-pre-wrap break-words">{message.text}</p>
//                                 )}
//                             </div>
//                         </div>
//                         <p className="text-xs text-secondary mt-1.5 px-1">{sentAt}</p>
//                     </div>
//                 </div>
//                 );
//             })}
//             {messages.length === 0 && (
//                 <div className="text-center text-secondary p-8">
//                     <p>This is the beginning of your conversation with {otherParticipant.name}.</p>
//                 </div>
//             )}
//             {isSending && otherParticipant.id !== 'chuk-ai' && (
//                 <div className="flex justify-end"><p className="text-xs text-secondary mt-1.5 px-1 italic">Sending...</p></div>
//             )}
//             <div ref={messagesEndRef} />
//             </div>
//         )}
//       </div>

//       <div className="p-4 bg-transparent flex-shrink-0">
//         <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
//           <input
//             type="text"
//             value={inputText}
//             onChange={handleInputChange}
//             placeholder="Type a message..."
//             className="flex-1 bg-surface border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0"
//           />
//           <button type="submit" className="bg-accent text-accent-text rounded-full w-11 h-11 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!inputText.trim() || isSending}>
//             {isSending ? <div className="w-5 h-5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
// const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;




import React, { useState, useRef, useEffect } from 'react';
import { Conversation, User, Message } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';
import MarkdownRenderer from '../common/MarkdownRenderer';

interface MessageAreaProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  currentUser: User;
  userMap: Map<string, User>;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

export const MessageArea: React.FC<MessageAreaProps> = ({ conversation, messages, isLoading, currentUser, userMap, isSending, onSendMessage, onBack, onViewProfile }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const otherParticipantId = conversation.participants.find(p => p.id !== currentUser.id)?.id;
  const otherParticipant = otherParticipantId ? userMap.get(otherParticipantId) : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, onlineUsers } = useSocket();

  const isOtherUserOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ userId }: { userId: string }) => {
      if (userId === otherParticipantId) setIsTyping(true);
    };
    const handleStopTyping = ({ userId }: { userId: string }) => {
      if (userId === otherParticipantId) setIsTyping(false);
    };
    socket.on('userTyping', handleTyping);
    socket.on('userStoppedTyping', handleStopTyping);

    return () => {
      socket.off('userTyping', handleTyping);
      socket.off('userStoppedTyping', handleStopTyping);
    };
  }, [socket, otherParticipantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket && otherParticipantId) {
      if (!typingTimeoutRef.current) {
        socket.emit('typing', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      if (socket && otherParticipantId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
        typingTimeoutRef.current = null;
      }
    }
  };

  if (!otherParticipant) {
    return (
      <div className="flex flex-col h-full bg-surface">
        <div className="flex items-center p-3 border-b border-border flex-shrink-0">
          <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
            <BackIcon />
          </button>
          <h2 className="text-lg font-bold text-primary">Error</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-secondary">Could not load conversation. The user may no longer exist.</p>
        </div>
      </div>
    );
  }

  return (
    // Removed rounded corners from the outer container
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center p-3 border-b border-border bg-surface flex-shrink-0 z-10">
        <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
          <BackIcon />
        </button>
        <div
          className="flex items-center cursor-pointer overflow-hidden"
          onClick={() => onViewProfile(otherParticipant)}
        >
          {otherParticipant.id === 'chuk-ai' ? (
            <img src="/chuk-ai.png" alt="Chuk AI" className="h-10 w-auto mr-3 flex-shrink-0 object-contain" />
          ) : (
            <UserAvatar user={otherParticipant} className="w-10 h-10 rounded-full mr-3 flex-shrink-0" isOnline={isOtherUserOnline} />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary leading-tight hover:underline truncate">{otherParticipant.name}</h2>
            {isTyping ? (
              <p className="text-sm text-accent leading-tight truncate italic">typing...</p>
            ) : (
              <p className="text-sm text-secondary leading-tight truncate">@{otherParticipant.username}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/duckload.gif" alt="Loading messages..." className="w-16 h-16" />
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {messages.map(message => {
              const isCurrentUser = message.senderId === currentUser.id;
              const sender = isCurrentUser ? currentUser : userMap.get(message.senderId);
              const sentAt = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              return (
                <div key={message.id} className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {!isCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0 self-start">
                      {sender?.id === 'chuk-ai' ? (
                        <img src="/chuk-ai.png" alt="Chuk AI" className="h-8 w-auto object-contain" />
                      ) : (
                        <UserAvatar user={sender || null} className="w-full h-full rounded-full" />
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col w-full max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {/* Modified rounded classes for proper chat bubble look */}
                    <div className={`px-4 py-2.5 ${isCurrentUser ? 'bg-accent text-accent-text rounded-2xl rounded-tr-none' : 'bg-surface text-primary shadow-sm rounded-2xl rounded-tl-none'}`}>

                      {/* SHARED CONTENT LOGIC */}
                      {(message.text.includes('Shared a story') || message.text.includes('Shared Story') || message.text.includes('[Shared Story]')) ? (
                        <div className="flex flex-col min-w-[200px]">
                          <span className="text-[10px] font-bold opacity-60 uppercase mb-2 tracking-wider">
                            {message.text.includes('Story by') ? message.text.split('\n').find(l => l.includes('Story by')) : 'Shared Story'}
                          </span>
                          {message.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden bg-black/10 aspect-video relative">
                              <img src={message.imageUrl} className="w-full h-full object-cover" alt="Story" />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const match = message.text.match(/\/story\/([a-zA-Z0-9-:]+)/);
                              if (match) window.dispatchEvent(new CustomEvent('open-story', { detail: match[1] }));
                            }}
                            className={`mt-1 text-xs font-bold py-1.5 px-4 rounded-full self-start transition-opacity hover:opacity-90 shadow-sm ${isCurrentUser ? 'bg-surface text-primary' : 'bg-primary text-surface'}`}
                          >
                            View Story
                          </button>
                        </div>
                      ) : (message.text.includes('Shared a post') || message.text.includes('Shared Post') || message.text.includes('[Shared Post]')) ? (
                        <div className="flex flex-col min-w-[200px]">
                          <span className="text-[10px] font-bold opacity-60 uppercase mb-2 tracking-wider">
                            {message.text.includes('Post by') ? message.text.split('\n').find(l => l.includes('Post by')) : 'Shared Post'}
                          </span>
                          {message.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden bg-black/10 aspect-video relative">
                              <img src={message.imageUrl} className="w-full h-full object-cover" alt="Post" />
                            </div>
                          )}
                          <p className="text-sm opacity-90 line-clamp-2 mb-3 italic">
                            "{message.text.split('\n').filter(line => !line.includes('/post/') && !line.includes('Shared a post') && !line.includes('Shared Post') && !line.includes('Post by')).join(' ').trim()}"
                          </p>
                          <button
                            onClick={() => {
                              const match = message.text.match(/\/post\/([a-zA-Z0-9-]+)/);
                              if (match) window.dispatchEvent(new CustomEvent('open-post', { detail: match[1] }));
                            }}
                            className={`text-xs font-bold py-1.5 px-4 rounded-full self-start transition-opacity hover:opacity-90 shadow-sm ${isCurrentUser ? 'bg-surface text-primary' : 'bg-primary text-surface'}`}
                          >
                            View Post
                          </button>
                        </div>
                      ) : (
                        /* NORMAL MESSAGE */
                        <>
                          {message.imageUrl && <img src={message.imageUrl} alt="Shared content" className="mb-2 rounded-lg w-full" />}
                          <div className="text-sm leading-relaxed">
                            {sender?.id === 'chuk-ai' ? (
                              <MarkdownRenderer text={message.text} />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.text}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-secondary mt-1.5 px-1">{sentAt}</p>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center text-secondary p-8">
                <p>This is the beginning of your conversation with {otherParticipant.name}.</p>
              </div>
            )}
            {isSending && otherParticipant.id !== 'chuk-ai' && (
              <div className="flex justify-end"><p className="text-xs text-secondary mt-1.5 px-1 italic">Sending...</p></div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border flex-shrink-0 z-20 w-full">
        <ChatInput
          value={inputText}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          placeholder="Type a message..."
          disabled={!inputText.trim()}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;