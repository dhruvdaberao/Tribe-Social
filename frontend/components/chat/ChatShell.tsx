import React from 'react';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';

interface ChatShellProps {
  header?: React.ReactNode;
  composer?: React.ReactNode;
  children: React.ReactNode;
  messagesRef?: React.RefObject<HTMLDivElement>;
  onMessagesScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  className?: string; // Additional classes for the outer container
  messagesClassName?: string; // Additional classes for the messages area
}

const ChatShell: React.FC<ChatShellProps> = ({
  header,
  composer,
  children,
  messagesRef,
  onMessagesScroll,
  className = '',
  messagesClassName = ''
}) => {
  useVisualViewportHeight();

  return (
    <div
      className={`chat-container flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-background ${className}`}
    >
      {header ? (
        <div className="chat-header flex-shrink-0 border-b border-border bg-background">
          {header}
        </div>
      ) : null}

      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className={`chat-messages min-h-0 flex-1 overflow-y-auto px-4 py-3 [scroll-behavior:smooth] ${messagesClassName}`}
      >
        {children}
      </div>

      {composer ? (
        <div
          className="chat-input sticky bottom-0 w-full flex-shrink-0 border-t border-border bg-background p-2.5"
        >
          {composer}
        </div>
      ) : null}
    </div>
  );
};

export default ChatShell;
