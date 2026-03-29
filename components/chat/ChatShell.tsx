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
      className={`chat-shell relative grid min-h-0 h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background ${className}`}
    >
      <header
        className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm w-full"
      >
        {header}
      </header>

      <div className={`min-h-0 overflow-y-auto overscroll-contain touch-pan-y ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="sticky bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),0px)] md:pb-0"
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
