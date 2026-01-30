import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { subscribeToPush, isSubscribedToPush } from '../../utils/pushNotifications';

interface NotificationPromptProps {
    onClose: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onClose }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        const subscribed = await isSubscribedToPush();
        setIsSubscribed(subscribed);
    };

    const handleEnable = async () => {
        setIsLoading(true);
        try {
            const success = await subscribeToPush();
            if (success) {
                setIsSubscribed(true);
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <div className="fixed bottom-4 right-4 bg-surface border border-border rounded-lg shadow-lg p-4 max-w-sm z-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-primary mb-1">All set!</h3>
                        <p className="text-sm text-secondary">You'll receive notifications for messages and activity.</p>
                    </div>
                    <button onClick={onClose} className="text-secondary hover:text-primary">
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-surface border border-border rounded-lg shadow-lg p-4 max-w-sm z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">Enable Notifications</h3>
                    <p className="text-sm text-secondary mb-3">
                        Get instant updates for messages and activity
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="flex-1 bg-accent text-accent-text px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                            {isLoading ? 'Enabling...' : 'Enable'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-surface border border-border hover:bg-background transition-colors text-sm font-medium text-secondary"
                        >
                            Not now
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="text-secondary hover:text-primary -mt-1">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default NotificationPrompt;
