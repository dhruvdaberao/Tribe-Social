import React, { useState, useRef, useEffect } from 'react';
import { Tribe, User, TribeMessage } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';
import { Send, Image as ImageIcon } from 'lucide-react';
import styled from 'styled-components';

interface TribeMessageAreaProps {
    tribe: Tribe;
    messages: TribeMessage[];
    isLoading: boolean;
    currentUser: User;
    isSending: boolean;
    onSendMessage: (text: string) => void;
    onViewProfile?: (user: User) => void;
}

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

export const TribeMessageArea: React.FC<TribeMessageAreaProps> = ({ tribe, messages, isLoading, currentUser, isSending, onSendMessage, onViewProfile }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    // Helper to resolve user from message
    const getSender = (msg: TribeMessage) => {
        // In TribeMessage, sender is directly populate as User object usually
        return msg.sender;
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Messages List - Flex 1 to take available space, overflow-y-auto to scroll INSIDE this container */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading && messages.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-70">
                        {/* Using the busstop gif as requested for consistency */}
                        <img src="/busstop.gif" alt="Loading messages..." className="w-24 h-auto mb-2" />
                        <p className="text-secondary text-sm">Loading legacy...</p>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-4 pb-4">
                        {messages.map((message, index) => {
                            const sender = getSender(message);
                            // Fallback if sender is missing (should not happen with populate)
                            const senderId = message.senderId || (sender as any)?.id; // Handle populated vs raw ID edge case
                            const isCurrentUser = senderId === currentUser.id;

                            // Show avatar only if previous message was from different user
                            const showAvatar = !isCurrentUser && (index === 0 || (messages[index - 1].senderId || (messages[index - 1].sender as any)?.id) !== senderId);

                            const sentAt = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                            return (
                                <div key={message._id || index} className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`} style={{ marginTop: showAvatar ? 12 : 2 }}>
                                    {!isCurrentUser && (
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 self-start">
                                            {showAvatar ? (
                                                <div className="cursor-pointer transition-transform hover:scale-110" onClick={() => onViewProfile && onViewProfile(sender)}>
                                                    <UserAvatar user={sender || null} />
                                                </div>
                                            ) : <div className="w-8" />}
                                        </div>
                                    )}
                                    <div className={`flex flex-col w-full max-w-[75%] lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                        {/* Name for group chat */}
                                        {!isCurrentUser && showAvatar && (
                                            <span className="text-xs text-secondary ml-3 mb-1 font-medium">{sender.name}</span>
                                        )}

                                        <div className={`px-4 py-2.5 shadow-sm ${isCurrentUser ? 'bg-accent text-accent-text rounded-2xl rounded-tr-none' : 'bg-surface text-primary rounded-2xl rounded-tl-none'}`}>
                                            {message.imageUrl && <img src={message.imageUrl} alt="Shared content" className="mb-2 rounded-lg w-full" />}
                                            <div className="text-sm leading-relaxed">
                                                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-secondary mt-1 px-1 opacity-70">{sentAt}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* EMPTY STATE */}
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-secondary p-8 flex flex-col items-center h-full justify-center opacity-80">
                                <div className="bg-surface p-4 rounded-full mb-4">
                                    <ImageIcon size={32} className="text-primary opacity-50" />
                                </div>
                                <p className="font-semibold text-lg text-primary">No messages yet</p>
                                <p className="text-sm">Be the first one to start the conversation!</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area - Sticky at bottom to ensure it's always visible on mobile */}
            <div className="p-3 bg-surface border-t border-border flex-shrink-0 sticky bottom-0 z-20 safe-area-bottom">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={`Message ${tribe.name}...`}
                        className="flex-1 bg-background border border-border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-primary min-w-0 shadow-inner text-sm"
                    />
                    <button type="submit" className="bg-accent text-accent-text rounded-full w-11 h-11 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!inputText.trim() || isSending}>
                        {isSending ? <div className="w-5 h-5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TribeMessageArea;
