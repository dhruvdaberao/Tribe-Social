import React, { useState, useRef, useEffect } from 'react';
import { Conversation, User, Message } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ChatShell from './ChatShell';
import ChatInput from './ChatInput';

interface MessageAreaProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  currentUser: User;
  userMap: Map<string, User>;
  isSending: boolean;
  isUploading: boolean;
  uploadProgress?: number | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onSendMessage: (payload: { text?: string; attachment?: File; replyTo?: string | null }) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeleteMessageForMe: (messageId: string) => void;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  conversation,
  messages,
  isLoading,
  currentUser,
  userMap,
  isSending,
  isUploading,
  uploadProgress,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onSendMessage,
  onDeleteMessage,
  onDeleteMessageForMe,
  onBack,
  onViewProfile
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const otherParticipantId = conversation.participants.find(p => p.id !== currentUser.id)?.id;
  const otherParticipant = otherParticipantId ? userMap.get(otherParticipantId) : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const { socket, onlineUsers } = useSocket();

  const isOtherUserOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false;

  useEffect(() => {
    if (isLoadingMore || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    if (isNearBottom || shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScrollRef.current = true;
    }
  }, [messages, isLoading, isLoadingMore]);

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
      onSendMessage({ text: inputText, replyTo: replyToMessage?.id || null });
      setInputText('');
      setReplyToMessage(null);
      if (socket && otherParticipantId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { roomId: `dm-${[currentUser.id, otherParticipantId].sort().join('-')}`, userId: currentUser.id, userName: currentUser.name });
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleAttachFile = (file: File) => {
    if (!file) return;
    onSendMessage({ attachment: file, replyTo: replyToMessage?.id || null });
    setReplyToMessage(null);
  };

  const openActionMenu = (message: Message) => {
    setActionMessage(message);
  };

  const handleTouchStart = (message: Message) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openActionMenu(message);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;

    if (!onLoadMore || !hasMore || isLoadingMore) return;
    if (container.scrollTop < 120) {
      onLoadMore();
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

  const renderAttachment = (message: Message) => {
    const attachmentUrl = message.attachmentUrl || message.imageUrl;
    const attachmentType = message.attachmentType || (message.imageUrl ? 'image/*' : null);

    if (!attachmentUrl) return null;

    if (attachmentType?.startsWith('image/')) {
      return <img src={attachmentUrl} alt={message.attachmentName || 'Attachment'} className="mb-2 rounded-lg w-full" />;
    }

    if (attachmentType?.startsWith('video/')) {
      return (
        <video controls className="mb-2 rounded-lg w-full">
          <source src={attachmentUrl} />
        </video>
      );
    }

    if (attachmentType?.startsWith('audio/')) {
      return (
        <audio controls className="mb-2 w-full">
          <source src={attachmentUrl} />
        </audio>
      );
    }

    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary hover:bg-surface"
      >
        <span className="font-semibold">Attachment</span>
        {message.attachmentName && <span className="text-secondary">{message.attachmentName}</span>}
      </a>
    );
  };

  return (
    <>
      <ChatShell
        className="flex-1"
        header={(
          <div className="border-b border-border bg-surface/95 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),0.75rem)] shadow-sm backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-3xl items-center">
            <button onClick={onBack} className="md:hidden p-2 -ml-2 mr-2 text-primary hover:bg-background rounded-full transition-colors">
              <BackIcon />
            </button>
            <div
              className="flex items-center cursor-pointer overflow-hidden group flex-1"
              onClick={() => onViewProfile(otherParticipant)}
            >
              {otherParticipant.id === 'chuk-ai' ? (
                <img src="/chuk-ai.png" alt="Chuk AI" className="h-10 w-auto mr-3 flex-shrink-0 object-contain drop-shadow-sm" />
              ) : (
                <UserAvatar user={otherParticipant} className="w-10 h-10 rounded-full mr-3 flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent/20 transition-all duration-300" isOnline={isOtherUserOnline} />
              )}
              <div className="min-w-0 flex flex-col justify-center">
                <h2 className="text-base font-bold text-primary leading-tight group-hover:text-accent transition-colors truncate">{otherParticipant.name}</h2>
                {isTyping ? (
                  <p className="text-xs text-accent font-medium animate-pulse">typing...</p>
                ) : (
                  <p className="text-xs text-secondary truncate font-medium">@{otherParticipant.username}</p>
                )}
              </div>
              {isLoading && messages.length === 0 && (
                <TinyLoader />
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} 
                className="p-2 ml-2 text-primary hover:bg-background rounded-full transition-colors flex-shrink-0"
              >
                <MoreOptionsIcon />
              </button>
              
              {isHeaderMenuOpen && (
                <div 
                  className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-surface shadow-lg overflow-hidden flex flex-col"
                >
                  <button
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onViewProfile(otherParticipant);
                    }}
                    className="px-4 py-3 text-left text-sm font-medium text-primary hover:bg-background transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>
            
            </div>
          </div>
        )}
        messagesRef={scrollContainerRef}
        onMessagesScroll={handleScroll}
        messagesClassName="mx-auto w-full max-w-3xl px-4 pt-4"
        composer={(
          <div className="mx-auto w-full max-w-3xl bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm">
            {replyToMessage && (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2 text-xs text-secondary shadow-sm">
                <div className="min-w-0 border-l-2 border-accent pl-2">
                  <p className="font-semibold text-primary">
                    Replying to {replyToMessage.senderId === currentUser.id ? 'You' : userMap.get(replyToMessage.senderId)?.name || 'User'}
                  </p>
                  <p className="truncate opacity-80">{replyToMessage.text}</p>
                </div>
                <button
                  type="button"
                  className="ml-3 p-1 rounded-full hover:bg-background text-secondary hover:text-primary transition-colors"
                  onClick={() => setReplyToMessage(null)}
                >
                  &times;
                </button>
              </div>
            )}
            <ChatInput
              value={inputText}
              onChange={handleInputChange}
              onSend={handleSendMessage}
              onAttachFile={handleAttachFile}
              placeholder="Type a message..."
              disabled={!inputText.trim()}
              isSending={isSending}
              isUploading={isUploading}
              uploadProgress={uploadProgress ?? undefined}
              inputRef={inputRef}
            />
          </div>
        )}
      >

        {isLoading && messages.length === 0 ? (
          <div className="relative w-full min-h-full flex items-center justify-center">
            <img src="/busstop.gif" width={80} alt="Loading..." className="mb-4" />
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <img src="/busstop.gif" width={40} alt="Loading..." />
              </div>
            )}
            {messages.map(message => {
              const isCurrentUser = message.senderId === currentUser.id;
              const sender = isCurrentUser ? currentUser : userMap.get(message.senderId);
              const sentAt = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
              const replySender = replyMessage ? (replyMessage.senderId === currentUser.id ? 'You' : userMap.get(replyMessage.senderId)?.name || 'User') : '';
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openActionMenu(message);
                  }}
                  onTouchStart={() => handleTouchStart(message)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0 self-start">
                      {sender?.id === 'chuk-ai' ? (
                        <img src="/chuk-ai.png" alt="Chuk AI" className="h-8 w-auto object-contain" />
                      ) : (
                        <UserAvatar user={sender || null} className="w-full h-full rounded-full" />
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[85%] md:max-w-sm lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {/* Modified rounded classes for proper chat bubble look */}
                    <div className={`px-4 py-2.5 break-words overflow-hidden w-full ${isCurrentUser ? 'bg-accent text-accent-text rounded-2xl rounded-tr-none' : 'bg-surface text-primary shadow-sm rounded-2xl rounded-tl-none'}`}>
                      {replyMessage && (
                        <div className={`mb-2 rounded-lg px-3 py-2 text-xs ${isCurrentUser ? 'bg-accent-text/20 text-accent-text' : 'bg-background text-secondary'}`}>
                          <p className="font-semibold">{replySender}</p>
                          <p className="line-clamp-2">{replyMessage.text}</p>
                        </div>
                      )}

                      {/* SHARED CONTENT LOGIC */}
                      {(message.text.includes('Shared a story') || message.text.includes('Shared Story') || message.text.includes('[Shared Story]')) ? (() => {
                        const match = message.text.match(/\/story\/([a-zA-Z0-9-:]+)(\?.*)?/);
                        const storyId = match ? match[1] : null;
                        const urlParams = new URLSearchParams(match && match[2] ? match[2] : '');
                        const owner = urlParams.get('owner');
                        const expiryStr = urlParams.get('expiry');
                        const expiry = expiryStr ? parseInt(expiryStr) : null;
                        const isExpired = expiry ? Date.now() > expiry : false;

                        if (isExpired) {
                          return (
                            <div className="flex flex-col min-w-[200px] opacity-75">
                              <span className="text-[10px] font-bold opacity-60 uppercase mb-1 tracking-wider">Shared Story</span>
                              {owner && <span className="text-xs text-secondary italic mb-2">Cycle ended for @{owner}</span>}

                              <div className="mb-2 rounded-lg overflow-hidden bg-black/20 aspect-video flex items-center justify-center border border-white/10">
                                <div className="text-center p-4">
                                  <p className="text-xs text-white/50">This story is no longer available</p>
                                </div>
                              </div>
                              <button disabled className="mt-1 text-xs font-bold py-1.5 px-4 rounded-full self-start bg-surface/50 text-secondary cursor-not-allowed">
                                Unavailable
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col min-w-[200px]">
                            <span className="text-[10px] font-bold opacity-60 uppercase mb-1 tracking-wider">Shared Story</span>
                            {owner && <span className="text-xs text-primary/80 mb-2 font-medium">From @{owner}</span>}

                            {message.imageUrl && (
                              <div className="mb-2 rounded-lg overflow-hidden bg-black/10 aspect-video relative">
                                <img src={message.imageUrl} className="w-full h-full object-cover" alt="Story" />
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (storyId) window.dispatchEvent(new CustomEvent('open-story', { detail: storyId }));
                              }}
                              className={`mt-1 text-xs font-bold py-1.5 px-4 rounded-full self-start transition-opacity hover:opacity-90 shadow-sm ${isCurrentUser ? 'bg-surface text-primary' : 'bg-primary text-surface'}`}
                            >
                              View Story
                            </button>
                          </div>
                        );
                      })() : (message.text.includes('Shared a post') || message.text.includes('Shared Post') || message.text.includes('[Shared Post]')) ? (() => {
                        const match = message.text.match(/\/post\/([a-zA-Z0-9-]+)(\?.*)?/);
                        const postId = match ? match[1] : null;
                        const urlParams = new URLSearchParams(match && match[2] ? match[2] : '');
                        const owner = urlParams.get('owner');

                        return (
                          <div className="flex flex-col min-w-[200px]">
                            <span className="text-[10px] font-bold opacity-60 uppercase mb-1 tracking-wider">Shared Post</span>
                            {owner && <span className="text-xs text-primary/80 mb-2 font-medium">From @{owner}</span>}

                            {message.imageUrl && (
                              <div className="mb-2 rounded-lg overflow-hidden bg-black/10 aspect-video relative">
                                <img src={message.imageUrl} className="w-full h-full object-cover" alt="Post" />
                              </div>
                            )}
                            <p className="text-sm opacity-90 line-clamp-2 mb-3 italic">
                              "{message.text.split('\n').filter(line => !line.includes('/post/') && !line.includes('Shared a post') && !line.includes('Shared Post')).join(' ').trim()}"
                            </p>
                            <button
                              onClick={() => {
                                if (postId) window.dispatchEvent(new CustomEvent('open-post', { detail: postId }));
                              }}
                              className={`text-xs font-bold py-1.5 px-4 rounded-full self-start transition-opacity hover:opacity-90 shadow-sm ${isCurrentUser ? 'bg-surface text-primary' : 'bg-primary text-surface'}`}
                            >
                              View Post
                            </button>
                          </div>
                        );
                      })() : (
                        /* NORMAL MESSAGE */
                        <>
                          {renderAttachment(message)}
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
                    <p className="text-xs text-secondary mt-1.5 px-1">
                      {message.status === 'sending' ? 'Sending…' : message.status === 'failed' ? 'Failed to send' : sentAt}
                    </p>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center text-secondary p-8">
                <p>This is the beginning of your conversation with {otherParticipant.name}.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ChatShell>
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
                onDeleteMessageForMe(actionMessage.id);
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
                  onDeleteMessage(actionMessage.id);
                  setActionMessage(null);
                }}
              >
                Delete for everyone
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const MoreOptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const TinyLoader = () => (
  <div className="ml-3 h-2 w-12 rounded-full bg-border opacity-70 animate-pulse" aria-hidden="true" />
);
