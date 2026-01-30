import React, { useState, useRef, useEffect } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { Send, Image as ImageIcon } from 'lucide-react';

interface TribeMessageAreaProps {
  tribe: Tribe;
  messages: TribeMessage[];
  isLoading: boolean;
  currentUser: User;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onViewProfile?: (user: User) => void;
}

const TribeMessageArea: React.FC<TribeMessageAreaProps> = ({
  tribe,
  messages,
  isLoading,
  currentUser,
  isSending,
  onSendMessage,
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

  return (
    <div
      className="
        flex flex-col flex-1
        bg-background
        min-h-0
      "
    >
      {/* ───────────── MESSAGE LIST ───────────── */}
      <div
        className="
          flex-1 overflow-y-auto
          px-4 py-3
          space-y-4
          pb-40 md:pb-4 /* 🔥 Fix: Ensure last message clears the sticky input (Input + Mobile Nav) */
        "
      >
        {isLoading && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-70">
            <img
              src="/busstop.gif"
              alt="Loading messages"
              className="w-24 h-auto mb-2"
            />
            <p className="text-sm text-secondary">Loading conversation…</p>
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
                    {message.imageUrl && !message.text.includes('[Shared Story]') && (
                      <img
                        src={message.imageUrl}
                        className="mb-2 rounded-lg w-full"
                        alt="shared"
                      />
                    )}

                    {message.text.includes('[Shared Story]') ? (
                      <div className="flex flex-col space-y-2">
                        <div className="bg-background/20 p-2 rounded-lg border-l-2 border-accent">
                          <p className="text-xs font-bold opacity-75">Shared Story</p>
                          <p className="text-sm">{message.text.replace('[Shared Story]', '').replace(/\/story\/[a-zA-Z0-9]+/, '').trim()}</p>
                        </div>
                        {message.text.match(/\/story\/([a-zA-Z0-9]+)/) && (
                          <button
                            onClick={() => {
                              const match = message.text.match(/\/story\/([a-zA-Z0-9]+)/);
                              if (match) {
                                window.dispatchEvent(new CustomEvent('open-story', { detail: match[1] }));
                              }
                            }}
                            className="bg-primary text-background text-xs font-bold py-1 px-3 rounded-full self-start hover:opacity-80 transition-opacity"
                          >
                            View Story
                          </button>
                        )}
                      </div>
                    ) : message.text.includes('[Shared Post]') ? (
                      <div className="flex flex-col space-y-2">
                        <div className="bg-background/20 p-2 rounded-lg border-l-2 border-primary">
                          <p className="text-xs font-bold opacity-75">Shared Content</p>
                          <p className="text-sm">{message.text.replace('[Shared Post]', '').replace(/\/post\/[a-zA-Z0-9-]+/, '').trim()}</p>
                        </div>

                        {/* View Post Button */}
                        {message.text.match(/\/post\/([a-zA-Z0-9-]+)/) && (
                          <button
                            onClick={() => {
                              const match = message.text.match(/\/post\/([a-zA-Z0-9-]+)/);
                              if (match) {
                                window.dispatchEvent(new CustomEvent('open-post', { detail: match[1] }));
                              }
                            }}
                            className="bg-primary text-background text-xs font-bold py-1 px-3 rounded-full self-start hover:opacity-80 transition-opacity"
                          >
                            View Post
                          </button>
                        )}

                        {/* External Link Button (if any) */}
                        {message.text.match(/https?:\/\/[^\s]+/) && (
                          <a
                            href={message.text.match(/https?:\/\/[^\s]+/)?.[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary text-background text-xs font-bold py-1 px-3 rounded-full self-start hover:opacity-80 transition-opacity"
                          >
                            Visit Link
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
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
                    )}
                  </div>

                  <span className="text-[10px] opacity-60 mt-1 ml-1">
                    {sentAt}
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
      {/* ───────────── INPUT BAR (MOBILE OPTIMIZED) ───────────── */}
      <div
        className="
          p-4 
          bg-background 
          border-t border-border
          flex-shrink-0 
          z-20
          sticky bottom-20 md:bottom-0 /* 🔥 Fix: Lift above mobile nav */
        "
      >
        <form
          onSubmit={handleSend}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${tribe.name}…`}
            className="
              flex-1
              bg-surface
              border border-border
              rounded-lg
              px-4 py-2.5
              focus:outline-none focus:ring-2 focus:ring-accent
              text-primary
              min-w-0
            "
            style={{
              fontSize: '16px' // Prevents zoom on iOS
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="
              w-12 h-11
              flex-shrink-0
              rounded-lg
              bg-accent
              text-accent-text
              flex items-center justify-center
              hover:bg-accent-hover
              transition-colors
              disabled:opacity-50
              shadow-sm
            "
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-accent-text border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TribeMessageArea;
