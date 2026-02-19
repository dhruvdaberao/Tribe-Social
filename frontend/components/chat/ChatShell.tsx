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
  const composerRef = React.useRef<HTMLDivElement>(null);
  const [composerOffset, setComposerOffset] = React.useState(0);

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

  React.useEffect(() => {
    if (!composerRef.current) {
      setComposerOffset(16);
      return;
    }

    const updateComposerOffset = () => {
      const composerHeight = composerRef.current?.offsetHeight ?? 0;
      setComposerOffset(composerHeight + 10);
    };

    updateComposerOffset();
    const observer = new ResizeObserver(updateComposerOffset);
    observer.observe(composerRef.current);
    window.visualViewport?.addEventListener('resize', updateComposerOffset);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener('resize', updateComposerOffset);
    };
  }, [composer]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden h-[var(--vvh,100dvh)] md:relative md:inset-auto md:z-0 md:h-full ${className}`}
    >
      {header ? (
        <div className="flex-none border-b border-border z-50">
          {header}
        </div>
      ) : null}

      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}
        style={{ paddingBottom: `${composerOffset}px` }}
      >
        {children}
      </div>

      {composer ? (
        <div
          ref={composerRef}
          className="flex-none bg-background border-t border-border z-50 pb-[max(env(safe-area-inset-bottom,0px),8px)] md:pb-0"
        >
          {composer}
        </div>
      ) : null}
    </div>
  );
};

export default ChatShell;
