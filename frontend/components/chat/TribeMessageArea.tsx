import React, { useState, useRef, useEffect } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { Image as ImageIcon } from 'lucide-react';
import ChatInput from './ChatInput';
import ChatShell from './ChatShell';

interface TribeMessageAreaProps {
  tribe: Tribe;
  messages: TribeMessage[];
  isLoading: boolean;
  currentUser: User;
  isSending: boolean;
  isUploading: boolean;
  uploadProgress?: number | null;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onSendMessage: (payload: { text?: string; attachment?: File; replyTo?: string | null }) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeleteMessageForMe: (messageId: string) => void;
  onViewProfile?: (user: User) => void;
}

const TribeMessageArea: React.FC<TribeMessageAreaProps> = ({
  tribe,
  messages,
  isLoading,
  currentUser,
  isSending,
  isUploading,
  uploadProgress,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onSendMessage,
  onDeleteMessage,
  onDeleteMessageForMe,
  onViewProfile
}) => {
  const [inputText, setInputText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<TribeMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<TribeMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ───────────── SCROLL TO BOTTOM SAFELY ───────────── */
  useEffect(() => {
    if (isLoadingMore) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMore]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage({ text: inputText, replyTo: replyToMessage?.id || null });
    setInputText('');
    setReplyToMessage(null);
  };

  const handleAttachFile = (file: File) => {
    if (!file) return;
    onSendMessage({ attachment: file, replyTo: replyToMessage?.id || null });
    setReplyToMessage(null);
  };

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

  const handleScroll = () => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    const container = scrollContainerRef.current;
    if (container && container.scrollTop < 120) {
      onLoadMore();
    }
  };

  const renderAttachment = (message: TribeMessage) => {
    const attachmentUrl = message.attachmentUrl || message.imageUrl;
    const attachmentType = message.attachmentType || (message.imageUrl ? 'image/*' : null);

    if (!attachmentUrl) return null;

    if (attachmentType?.startsWith('image/')) {
      return <img src={attachmentUrl} className="mb-2 rounded-lg w-full" alt={message.attachmentName || 'attachment'} />;
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
        messagesRef={scrollContainerRef}
        onMessagesScroll={handleScroll}
        messagesClassName="w-full px-4 py-3 space-y-4"
        composer={(
          <div className="px-3 py-2 pb-0">
            {replyToMessage && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs text-secondary">
                <div className="min-w-0">
                  <p className="font-semibold text-primary">
                    Replying to {replyToMessage.senderId === currentUser.id ? 'You' : replyToMessage.sender?.name || 'User'}
                  </p>
                  <p className="truncate">{replyToMessage.text}</p>
                </div>
                <button
                  type="button"
                  className="ml-3 text-secondary hover:text-primary"
                  onClick={() => setReplyToMessage(null)}
                >
                  &times;
                </button>
              </div>
            )}
            <ChatInput
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onSend={handleSend}
              onAttachFile={handleAttachFile}
              placeholder={`Message ${tribe.name}…`}
              disabled={!inputText.trim()}
              isSending={isSending}
              isUploading={isUploading}
              uploadProgress={uploadProgress ?? undefined}
              inputRef={inputRef}
            />
          </div>
        )}
      >
        {isLoading && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-70">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-secondary">Loading conversation…</p>
          </div>
        )}
        {isLoadingMore && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading &&
          messages.map((message, index) => {
            const sender = message.sender;
            // 🔥 Fix: Robust ID check (handle _id or id)
            const senderId = (sender as any)?._id || (sender as any)?.id || message.senderId;
            const currentUserId = (currentUser as any)?._id || currentUser.id;

            const isCurrentUser = senderId === currentUserId;

            const prevSenderId =
              (messages[index - 1]?.sender as any)?._id ||
              (messages[index - 1]?.sender as any)?.id ||
              messages[index - 1]?.senderId;

            const showAvatar =
              !isCurrentUser &&
              (index === 0 || prevSenderId !== senderId);

            const sentAt = new Date(message.timestamp).toLocaleTimeString(
              [],
              { hour: '2-digit', minute: '2-digit' }
            );
            const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
            const replySenderName = replyMessage
              ? (replyMessage.senderId === currentUserId ? 'You' : replyMessage.sender?.name || 'User')
              : '';

            return (
              <div
                key={message.id || (message as any)._id || index}
                className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openActionMenu(message);
                }}
                onTouchStart={() => handleTouchStart(message)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              >
                {/* AVATAR */}
                {!isCurrentUser && (
                  <div className="w-8 h-8 flex-shrink-0 mb-5"> {/* 🔥 Fix: Lift avatar above timestamp */}
                    {showAvatar ? (
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          onViewProfile?.(sender)
                        }
                      >
                        <UserAvatar user={sender || null} />
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`max-w-[75%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'
                    }`}
                >
                  {!isCurrentUser && showAvatar && (
                    <span className="text-xs text-secondary mb-1 ml-1">
                      {sender?.name || 'Unknown'}
                    </span>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${isCurrentUser
                      ? 'bg-accent text-accent-text rounded-tr-none'
                      : 'bg-surface text-primary rounded-tl-none'
                      }`}
                  >
                    {replyMessage && (
                      <div className={`mb-2 rounded-lg px-3 py-2 text-xs ${isCurrentUser ? 'bg-accent-text/20 text-accent-text' : 'bg-background text-secondary'}`}>
                        <p className="font-semibold">{replySenderName}</p>
                        <p className="line-clamp-2">{replyMessage.text}</p>
                      </div>
                    )}
                    {/* SHARED STORY CARD */}
                    {(message.text.includes('Shared a story') || message.text.includes('Shared Story') || message.text.includes('[Shared Story]')) ? (
                      <div className="flex flex-col min-w-[200px]">
                        <span className="text-[10px] font-bold text-secondary uppercase mb-2 tracking-wider">Shared Story</span>
                        {message.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden bg-secondary aspect-video relative">
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
                        <span className="text-[10px] font-bold opacity-60 uppercase mb-2 tracking-wider">Shared Post</span>
                        {message.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden bg-black/10 aspect-video relative">
                            <img src={message.imageUrl} className="w-full h-full object-cover" alt="Post" />
                          </div>
                        )}
                        {/* Snippet for post text, cleaned of metadata */}
                        <p className="text-sm opacity-90 line-clamp-2 mb-3 italic">
                          "{message.text.split('\n').filter(line => !line.includes('/post/') && !line.includes('Shared a post') && !line.includes('Shared Post')).join(' ').trim()}"
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
                      /* NORMAL MESSAGE (Text + Optional Image) */
                      <>
                        {renderAttachment(message)}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.text}
                          {/* Simple URL Link detection */}
                          {message.text.match(/https?:\/\/[^\s]+/) && (
                            <a
                              href={message.text.match(/https?:\/\/[^\s]+/)?.[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-2 text-xs underline opacity-80"
                            >
                              {message.text.match(/https?:\/\/[^\s]+/)?.[0]}
                            </a>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  <span className="text-[10px] opacity-60 mt-1 ml-1">
                    {message.status === 'sending' ? 'Sending…' : message.status === 'failed' ? 'Failed to send' : sentAt}
                  </span>
                </div>
              </div>
            );
          })}

        {!isLoading && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-80 text-center">
            <div className="bg-surface p-4 rounded-full mb-4">
              <ImageIcon size={32} className="opacity-50" />
            </div>
            <p className="font-semibold">No messages yet</p>
            <p className="text-sm opacity-70">
              Start the conversation ✨
            </p>
          </div>
        )}

        <div ref={bottomRef} />
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

export default TribeMessageArea;
