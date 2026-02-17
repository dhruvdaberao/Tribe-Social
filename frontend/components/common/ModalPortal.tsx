import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  zIndex?: number;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

const OPEN_MODAL_COUNT_ATTR = 'data-modal-open-count';
const ORIGINAL_OVERFLOW_ATTR = 'data-modal-original-overflow';

const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  zIndex = 9999,
  overlayClassName,
  overlayStyle,
  contentClassName,
  contentStyle,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const currentCount = Number(body.getAttribute(OPEN_MODAL_COUNT_ATTR) ?? '0');

    if (currentCount === 0) {
      body.setAttribute(ORIGINAL_OVERFLOW_ATTR, body.style.overflow);
      body.style.overflow = 'hidden';
    }

    body.setAttribute(OPEN_MODAL_COUNT_ATTR, String(currentCount + 1));

    return () => {
      const nextCount = Math.max(Number(body.getAttribute(OPEN_MODAL_COUNT_ATTR) ?? '1') - 1, 0);

      if (nextCount === 0) {
        body.style.overflow = body.getAttribute(ORIGINAL_OVERFLOW_ATTR) ?? '';
        body.removeAttribute(ORIGINAL_OVERFLOW_ATTR);
        body.removeAttribute(OPEN_MODAL_COUNT_ATTR);
      } else {
        body.setAttribute(OPEN_MODAL_COUNT_ATTR, String(nextCount));
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.requestAnimationFrame(() => {
      const firstInteractive = contentRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      firstInteractive?.focus();
    });

    return () => window.cancelAnimationFrame(focusTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={overlayClassName}
      onClick={closeOnOverlayClick ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))',
        ...overlayStyle,
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={contentRef}
        className={contentClassName}
        style={contentStyle}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalPortal;
