import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalWrapperProps {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string; // For the content container
    showCloseButton?: boolean;
    title?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
    children,
    onClose,
    className = '',
    showCloseButton = false,
    title
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            style={{ height: '100dvh' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content Container */}
            <div
                className={`relative w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh] animate-in fade-in zoom-in duration-200 ${className}`}
                role="dialog"
                aria-modal="true"
                onClick={e => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0 z-10">
                        {title ? <h2 className="text-lg font-semibold text-primary truncate">{title}</h2> : <div />}
                        {showCloseButton && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 text-secondary hover:text-primary rounded-full hover:bg-black/5 transition-colors"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                <div className="overflow-y-auto flex-1 overscroll-contain">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalWrapper;
