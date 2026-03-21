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

    return (
        <form onSubmit={onSend} className="flex items-center space-x-3 w-full">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-full text-secondary flex items-center justify-center hover:bg-surface hover:text-primary transition-all duration-200"
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
                        if (file && onAttachFile) {
                            onAttachFile(file);
                        }
                        if (event.target.value) event.target.value = '';
                    }}
                />
            </div>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1 bg-surface border-none ring-1 ring-border rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0 shadow-sm transition-shadow duration-200"
                style={{ fontSize: '16px' }} // iOS zoom prevention (from TribeMessageArea, good to keep)
            />
            <button
                type="submit"
                className={`rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${!value.trim() ? 'bg-surface text-secondary' : 'bg-accent text-accent-text hover:bg-accent/90 shadow-md hover:shadow-lg hover:scale-105 active:scale-95'}`}
                disabled={disabled || isSending || isUploading}
            >
                {isSending ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <SendIcon />
                )}
            </button>
            {isUploading && (
                <div className="ml-2 text-xs text-secondary min-w-[60px] text-right">
                    {typeof uploadProgress === 'number' ? `${uploadProgress}%` : 'Uploading'}
                </div>
            )}
        </form>
    );
};

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
    </svg>
);

export default ChatInput;
