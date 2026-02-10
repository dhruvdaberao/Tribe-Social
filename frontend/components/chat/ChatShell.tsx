import React from 'react';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';

interface ChatShellProps {
  header?: React.ReactNode;
  composer?: React.ReactNode;
  children: React.ReactNode;
  messagesRef?: React.RefObject<HTMLDivElement>;
  onMessagesScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
  messagesClassName?: string;
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
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, []);

  return (
    <div
      className={`flex flex-col min-h-0 h-full bg-background overflow-hidden ${className}`}
      style={{ height: 'var(--vvh, 100dvh)' }}
    >
      {header ? (
        <div className="flex-none sticky top-0 z-50 bg-surface">
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
        <div className="flex-none sticky bottom-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
          {composer}
        </div>
      ) : null}
    </div>
  );
};

export default ChatShell;
