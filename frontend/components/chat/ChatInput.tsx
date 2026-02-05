import React from 'react';

interface ChatInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSend: (e: React.FormEvent) => void;
    placeholder: string;
    disabled?: boolean;
    isSending?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    placeholder,
    disabled = false,
    isSending = false,
    inputRef
}) => {
    return (
        <form onSubmit={onSend} className="flex items-center space-x-3 w-full">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0"
                style={{ fontSize: '16px' }} // iOS zoom prevention (from TribeMessageArea, good to keep)
            />
            <button
                type="submit"
                className="bg-accent text-accent-text rounded-lg w-12 h-11 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50"
                disabled={disabled || isSending}
            >
                {isSending ? (
                    <div className="w-5 h-5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <SendIcon />
                )}
            </button>
        </form>
    );
};

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

export default ChatInput;
