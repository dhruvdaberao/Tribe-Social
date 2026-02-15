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

  React.useEffect(() => {
    // Prevent body scroll while chat is open to avoid double scrollbars
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Also try to prevent overscroll behavior on body
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overscrollBehaviorY = '';
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden h-[var(--vvh,100vh)] md:relative md:inset-auto md:z-0 md:h-full ${className}`}
    >
      {header ? (
        <div className="flex-none bg-surface border-b border-border z-50">
          {header}
        </div>
      ) : null}

      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}
      >
        {children}
      </div>

      {composer ? (
        <div className="flex-none bg-background border-t border-border pb-[env(safe-area-inset-bottom)] z-50">
          {composer}
        </div>
      ) : null}
    </div>
  );
};

export default ChatShell;
