import React from 'react';
import useChatViewport from '../../hooks/useChatViewport';

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
  useChatViewport();

  return (
    <section
      className={`chat-shell grid grid-rows-[auto_minmax(0,1fr)_auto] h-[var(--chat-vh,100vh)] supports-[height:100dvh]:h-[var(--chat-vh,100dvh)] min-h-0 w-full overflow-hidden bg-background ${className}`}
      style={{
        ['--chat-vh' as string]: 'var(--vvh, 100dvh)',
      }}
    >
      <header className="z-30 border-b border-border bg-surface w-full relative">
        {header}
      </header>

      <div className={`min-h-0 overflow-y-auto overscroll-contain ${messagesClassName}`}>
        {children}
      </div>

      <footer
        className="z-30 border-t border-border bg-surface"
        style={{
          transform: 'translateY(calc(-1 * var(--keyboardOffset, 0px)))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {composer}
      </footer>
    </section>
  );
};

export default ChatShell;
