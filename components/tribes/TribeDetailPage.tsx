


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';
import TribeMembersModal from './TribeMembersModal';
import * as api from '../../api';
import ChatShell from '../chat/ChatShell';

interface TribeDetailPageProps {
  tribe: Tribe;
  currentUser: User;
  userMap: Map<string, User>;
  onSendMessage: (tribeId: string, text: string, imageUrl?: string, replyTo?: string | null) => void;
  onDeleteMessage: (tribeId: string, messageId: string) => void;
  onDeleteMessageForMe: (tribeId: string, messageId: string) => void;
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
  const { tribe, currentUser, userMap, onSendMessage, onDeleteMessage, onDeleteMessageForMe, onDeleteTribe, onBack, onViewProfile, onEditTribe, onKickMember } = props;
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isMembersModalOpen, setMembersModalOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<TribeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<TribeMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<TribeMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, clearUnreadTribe } = useSocket();
  const previousMessageCountRef = useRef(0);
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
      const isNewMessage = localMessages.length > previousMessageCountRef.current;
      messagesEndRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'auto', block: 'end' });
      previousMessageCountRef.current = localMessages.length;
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
        replyTo: replyToMessage?.id || null,
      };

      setLocalMessages(prev => [...prev, tempMessage]);

      // Send to backend
      onSendMessage(tribe.id, textToSend, undefined, replyToMessage?.id || null);
      setReplyToMessage(null);

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

  const openActionMenu = (message: TribeMessage) => {
    setActionMessage(message);
  };

  const handleTouchStart = (message: TribeMessage) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openActionMenu(message);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleViewProfileFromModal = (user: User) => {
    onViewProfile(user);
    setMembersModalOpen(false);
  }

  return (
    <>
      <ChatShell
        className="h-full md:bg-surface md:border md:border-border md:shadow-md"
        header={(
          <div className="flex items-center px-3 py-3 md:px-4 bg-surface border-b border-border">
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
        )}
        composer={(
          <div className="px-3 pt-3 pb-3 md:px-4 bg-surface">
            {replyToMessage && (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-secondary">Replying to {replyToMessage.senderId === currentUser.id ? 'yourself' : (replyToMessage.sender?.name || 'member')}</p>
                  <p className="text-sm text-primary truncate">{replyToMessage.text}</p>
                </div>
                <button type="button" className="text-secondary hover:text-primary" onClick={() => setReplyToMessage(null)} aria-label="Cancel reply">
                  <CloseIcon />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isMember ? `Message #${tribe.name}` : "You must be a member to chat"}
                className="flex-1 bg-background border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0"
                disabled={!isMember || isLoading}
                ref={inputRef}
              />
              <button type="submit" className="bg-accent text-accent-text rounded-2xl w-12 h-12 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!inputText.trim() || !isMember || isLoading}>
                <SendIcon />
              </button>
            </form>
          </div>
        )}
        messagesClassName="p-4 bg-background"
      >

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
              const replyMessage = message.replyTo ? localMessages.find(m => m.id === message.replyTo) : null;
              const replySenderName = replyMessage ? (replyMessage.senderId === currentUser.id ? 'You' : replyMessage.sender?.name || userMap.get(replyMessage.senderId || '')?.name || 'User') : '';

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openActionMenu(message);
                  }}
                  onTouchStart={() => handleTouchStart(message)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
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
                      {replyMessage && (
                        <div className={`mb-2 rounded-lg px-3 py-2 text-xs ${isCurrentUser ? 'bg-accent-text/20 text-accent-text' : 'bg-background text-secondary'}`}>
                          <p className="font-semibold">{replySenderName}</p>
                          <p className="line-clamp-2">{replyMessage.text}</p>
                        </div>
                      )}
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
        {actionMessage && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center"
            onClick={() => setActionMessage(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-surface shadow-lg border border-border overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-background"
                onClick={() => {
                  setReplyToMessage(actionMessage);
                  setActionMessage(null);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
              >
                Reply
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-background"
                onClick={() => {
                  onDeleteMessageForMe(tribe.id, actionMessage.id);
                  setActionMessage(null);
                }}
              >
                Delete for me
              </button>
              {actionMessage.senderId === currentUser.id && (
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    onDeleteMessage(tribe.id, actionMessage.id);
                    setActionMessage(null);
                  }}
                >
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
        )}
      </ChatShell>
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
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const TrashIcon = ({ className = 'h-5 w-5' }: { className?: string; }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


export default TribeDetailPage;
