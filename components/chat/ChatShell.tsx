import React, { useEffect } from 'react';

interface ChatShellProps {
  header: React.ReactNode;
  composer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  messagesClassName?: string;
}

const updateViewportHeightVar = () => {
  if (typeof window === 'undefined') return;
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--vvh', `${height}px`);
};

const ChatShell: React.FC<ChatShellProps> = ({
  header,
  composer,
  children,
  className = '',
  messagesClassName = ''
}) => {
  useEffect(() => {
    updateViewportHeightVar();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateViewportHeightVar);
    viewport?.addEventListener('scroll', updateViewportHeightVar);
    window.addEventListener('resize', updateViewportHeightVar);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorY;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      viewport?.removeEventListener('resize', updateViewportHeightVar);
      viewport?.removeEventListener('scroll', updateViewportHeightVar);
      window.removeEventListener('resize', updateViewportHeightVar);

      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehaviorY = previousBodyOverscroll;
    };
  }, []);

  return (
    <section
      className={`h-[var(--vvh,100dvh)] md:h-full min-h-0 w-full flex flex-col overflow-hidden bg-background ${className}`}
    >
      <header className="z-30 flex-none border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
        {header}
      </header>

      <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}>
        {children}
      </div>

      <footer className="z-30 flex-none border-t border-border bg-surface pb-[max(env(safe-area-inset-bottom),0px)]">
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
