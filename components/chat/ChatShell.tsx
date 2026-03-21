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
      className={`chat-shell flex h-full min-h-0 w-full flex-col overflow-hidden bg-background ${className}`}
    >
      <header
        className="sticky top-0 z-30 w-full flex-shrink-0 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85"
      >
        {header}
      </header>

      <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="sticky bottom-0 z-30 flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85"
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
