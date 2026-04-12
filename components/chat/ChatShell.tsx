import React from 'react';


interface ChatShellProps {
  header: React.ReactNode;
  composer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  messagesClassName?: string;
}

const ChatShell: React.FC<ChatShellProps> = ({
  header,
  composer,
  children,
  className = '',
  messagesClassName = ''
}) => {
  React.useEffect(() => {
    const previousBodyOverscroll = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      document.body.style.overscrollBehaviorY = previousBodyOverscroll;
    };
  }, []);

  return (
    <section
      className={`chat-shell messages-page relative flex h-full min-h-0 w-full flex-col bg-background ${className}`}
    >
      <header
        className="messages-header sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm w-full"
      >
        {header}
      </header>

      <div className={`messages-container min-h-0 flex-1 overscroll-contain touch-pan-y p-3 pb-20 ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="chat-input-container sticky bottom-0 z-30 w-full border-t border-border bg-surface/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),0px)] md:pb-0"
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
