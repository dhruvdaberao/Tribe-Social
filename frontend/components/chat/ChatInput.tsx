import React from 'react';

interface ChatInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSend: (e: React.FormEvent) => void;
    placeholder: string;
    disabled?: boolean;
    isSending?: boolean;
    isUploading?: boolean;
    uploadProgress?: number;
    onAttachFile?: (file: File) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    placeholder,
    disabled = false,
    isSending = false,
    isUploading = false,
    uploadProgress,
    onAttachFile,
    inputRef
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const canSend = value.trim().length > 0 && !disabled && !isSending && !isUploading;

    return (
        <form onSubmit={onSend} className="flex w-full items-end gap-2 sm:gap-3">
            <div className="relative shrink-0">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-surface text-secondary shadow-sm transition hover:-translate-y-0.5 hover:text-primary disabled:opacity-50"
                    aria-label="Attach media"
                    disabled={isUploading}
                >
                    <PlusIcon />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file && onAttachFile) onAttachFile(file);
                        if (event.target.value) event.target.value = '';
                    }}
                />
            </div>
            <div className="relative min-w-0 flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="min-w-0 w-full rounded-[26px] border border-border/80 bg-surface px-4 py-3 pr-12 text-primary shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    style={{ fontSize: '16px' }}
                />
                {isUploading && (
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-medium text-secondary">
                        {typeof uploadProgress === 'number' ? `${uploadProgress}%` : 'Uploading'}
                    </div>
                )}
            </div>
            <button
                type="submit"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${canSend ? 'bg-accent text-accent-text shadow-lg shadow-accent/25 hover:-translate-y-0.5 hover:bg-accent/90' : 'bg-surface text-secondary ring-1 ring-border'}`}
                disabled={!canSend}
                aria-label="Send message"
            >
                {isSending ? <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <SendIcon />}
            </button>
        </form>
    );
};

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
    </svg>
);

export default ChatInput;
