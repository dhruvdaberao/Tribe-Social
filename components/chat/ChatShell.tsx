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
  return (
    <section
      className={`chat-shell flex flex-col h-full min-h-0 w-full overflow-hidden bg-background ${className}`}
    >
      <header
        className="flex-shrink-0 z-[1000] border-b border-border bg-surface w-full"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {header}
      </header>

      <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="flex-shrink-0 z-40 border-t border-border bg-surface"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
