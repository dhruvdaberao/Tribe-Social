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
            const senderId =
              message.senderId || (sender as any)?.id;

            const isCurrentUser = senderId === currentUser.id;

            const prevSenderId =
              messages[index - 1]?.senderId ||
              (messages[index - 1]?.sender as any)?.id;

            const showAvatar =
              !isCurrentUser &&
              (index === 0 || prevSenderId !== senderId);

            const sentAt = new Date(message.timestamp).toLocaleTimeString(
              [],
              { hour: '2-digit', minute: '2-digit' }
            );

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* AVATAR */}
                {!isCurrentUser && (
                  <div className="w-8 h-8 flex-shrink-0">
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
                  className={`max-w-[75%] flex flex-col ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {!isCurrentUser && showAvatar && (
                    <span className="text-xs text-secondary mb-1">
                      {sender?.name}
                    </span>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${
                      isCurrentUser
                        ? 'bg-accent text-accent-text rounded-tr-none'
                        : 'bg-surface text-primary rounded-tl-none'
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        className="mb-2 rounded-lg w-full"
                        alt="shared"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  </div>

                  <span className="text-[10px] opacity-60 mt-1">
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
      <form
        onSubmit={handleSend}
        className="
          flex items-center gap-2
          px-3 py-2
          border-t border-border
          bg-surface
          sticky bottom-0
          z-20
          safe-area-bottom
        "
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`Message ${tribe.name}…`}
          className="
            flex-1 min-w-0
            px-4 py-3
            rounded-full
            border border-border
            bg-background
            text-sm
            focus:outline-none
          "
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="
            w-11 h-11
            rounded-full
            bg-accent
            text-accent-text
            flex items-center justify-center
            disabled:opacity-50
          "
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default TribeMessageArea;
