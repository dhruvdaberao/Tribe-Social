import React, { useState, useRef, useEffect } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { Image as ImageIcon } from 'lucide-react';
import ChatInput from './ChatInput';

interface TribeMessageAreaProps {
  tribe: Tribe;
  messages: TribeMessage[];
  isLoading: boolean;
  currentUser: User;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onSendAttachment: (file: File) => void;
  isUploadingAttachment: boolean;
  hasMoreMessages: boolean;
  onLoadOlder: () => void;
  isLoadingOlder: boolean;
  onViewProfile?: (user: User) => void;
}

const TribeMessageArea: React.FC<TribeMessageAreaProps> = ({
  tribe,
  messages,
  isLoading,
  currentUser,
  isSending,
  onSendMessage,
  onSendAttachment,
  isUploadingAttachment,
  hasMoreMessages,
  onLoadOlder,
  isLoadingOlder,
  onViewProfile
}) => {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ───────────── SCROLL TO BOTTOM SAFELY ───────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const renderAttachment = (message: TribeMessage) => {
    if (!message.attachmentUrl || !message.attachmentType) return null;
    if (message.attachmentType.startsWith('video/')) {
      return <video controls src={message.attachmentUrl} className="w-full rounded-lg mb-2" />;
    }
    if (message.attachmentType.startsWith('audio/')) {
      return <audio controls src={message.attachmentUrl} className="w-full mb-2" />;
    }
    if (message.attachmentType === 'application/pdf') {
      return (
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-semibold text-primary underline mb-2"
        >
          {message.attachmentName || 'Open PDF'}
        </a>
      );
    }
    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-primary underline mb-2 block"
      >
        {message.attachmentName || 'View attachment'}
      </a>
    );
  };

  return (
    <div
      className="
        flex flex-col flex-1
        bg-background
        min-h-0
      "
    >
      <div
        className="
          flex-1 overflow-y-auto w-full
          px-4 py-3
          space-y-4
          min-h-0
        "
      >
        {isLoading && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-70">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-secondary">Loading conversation…</p>
          </div>
        )}

        {!isLoading && hasMoreMessages && (
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="self-center text-xs font-semibold text-secondary hover:text-primary"
          >
            {isLoadingOlder ? 'Loading earlier...' : 'Load earlier messages'}
          </button>
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

            return (
              <div
                key={message.id || (message as any)._id || index}
                className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
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
                        {message.imageUrl && <img src={message.imageUrl} className="mb-2 rounded-lg w-full" alt="shared" />}
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
                    {sentAt}
                    {message.id.startsWith('temp-') && <span className="ml-2 italic">Sending...</span>}
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
      </div>

      {/* ───────────── INPUT BAR (MOBILE SAFE) ───────────── */}
      {/* ───────────── INPUT BAR (MOBILE SAFE) ───────────── */}
      <div
        className="
          p-4 
          pb-[calc(1rem+env(safe-area-inset-bottom))]
          bg-background 
          border-t border-border
          flex-shrink-0 
          z-20
          w-full
          sticky bottom-0
        "
      >
        <ChatInput
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onSend={handleSend}
          placeholder={`Message ${tribe.name}…`}
          disabled={!inputText.trim()}
          isSending={isSending}
          onAttach={onSendAttachment}
          isUploading={isUploadingAttachment}
        />
      </div>
    </div>
  );
};

export default TribeMessageArea;
