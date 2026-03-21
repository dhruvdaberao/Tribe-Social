import React from 'react';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';

interface ChatShellProps {
  header?: React.ReactNode;
  composer?: React.ReactNode;
  children: React.ReactNode;
  messagesRef?: React.RefObject<HTMLDivElement | null>;
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
  const composerRef = React.useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = React.useState(84);

  React.useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorY;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overscrollBehaviorY = previousBodyOverscroll;
    };
  }, []);

  React.useEffect(() => {
    const updateComposerHeight = () => setComposerHeight((composerRef.current?.offsetHeight ?? 72) + 12);
    updateComposerHeight();
    if (!composerRef.current) return;

    const observer = new ResizeObserver(updateComposerHeight);
    observer.observe(composerRef.current);
    window.visualViewport?.addEventListener('resize', updateComposerHeight);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener('resize', updateComposerHeight);
    };
  }, [composer]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:relative ${className}`}
      style={{ height: 'var(--vvh, 100dvh)' }}
    >
      {header ? (
        <div className="sticky top-0 z-40 flex-none bg-background/95 backdrop-blur-md">
          {header}
        </div>
      ) : null}

      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] ${messagesClassName}`}
        style={{ paddingBottom: composer ? `${composerHeight}px` : undefined }}
      >
        {children}
      </div>

      {composer ? (
        <div
          ref={composerRef}
          className="sticky bottom-0 z-40 flex-none border-t border-border bg-background/95 backdrop-blur-xl"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--keyboard-inset, 0px))' }}
        >
          {composer}
        </div>
      ) : null}
    </div>
  );
};

export default ChatShell;
