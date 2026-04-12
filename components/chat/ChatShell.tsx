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
      className={`chat-shell chat-page messages-page relative flex h-full min-h-0 w-full max-w-full flex-col bg-background ${className}`}
    >
      <header
        className="chat-header messages-header sticky top-0 z-[100] flex w-full items-center justify-between border-b border-border bg-background px-4 py-3 pt-[calc(12px+env(safe-area-inset-top,0px))] shadow-none box-border pt-16 md:pt-3"
      >
        {header}
      </header>

      <div className={`chat-body chat-body-wrapper messages-list messages-container min-h-0 flex-1 w-full max-w-full overflow-y-auto p-[12px] pb-[90px] bg-background box-border [webkit-overflow-scrolling:touch] ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="chat-input-container sticky bottom-0 z-[60] w-full box-border border-t border-border bg-background px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
