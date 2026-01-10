import React, { useEffect, useCallback } from 'react';
import { Notification, User, Tribe } from '../../types';
import UserAvatar from '../common/UserAvatar';
import * as api from '../../api.ts';
import { useSocket } from '../../contexts/SocketContext';

interface NotificationsPageProps {
  notifications: Notification[];
  allTribes: Tribe[];
  onViewProfile: (user: User) => void;
  onViewMessage: (user: User) => void;
  onViewPost: (postId: string) => void;
  onViewTribe: (tribe: Tribe) => void;
  onViewStory: (userId: string) => void;
}

const timeAgo = (dateString: string) => {
    if (!dateString) return '...';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const NotificationItem: React.FC<{ notification: Notification; allTribes: Tribe[]; onViewProfile: (user: User) => void; onViewMessage: (user: User) => void; onViewPost: (postId: string) => void; onViewTribe: (tribe: any) => void; onViewStory: (userId: string) => void; }> = ({ notification, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
  const sender = notification.sender;
  if (!sender) return null; // Defensive check for ghost notifications

  const renderText = () => {
    switch (notification.type) {
      case 'follow': return 'started following you.';
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'message': return 'sent you a message.';
      case 'story_like': return 'liked your story.';
      case 'tribe_join':
        const tribe = allTribes.find(t => t.id === notification.tribeId);
        return `joined your tribe: ${tribe?.name || 'Tribe'}`;
      default: return '';
    }
  };
  
  const handleClick = () => {
    switch (notification.type) {
        case 'follow': onViewProfile(sender); break;
        case 'story_like': onViewStory(sender.id); break;
        case 'message': onViewMessage(sender); break;
        case 'like':
        case 'comment': if (notification.postId) onViewPost(notification.postId); break;
        case 'tribe_join':
            if (notification.tribeId) {
                const tribe = allTribes.find(t => t.id === notification.tribeId);
                if (tribe) onViewTribe(tribe);
            }
            break;
    }
  };

  return (
    <div className={`bg-surface rounded-2xl border shadow-sm p-4 transition-colors ${!notification.read ? 'border-accent/50' : 'border-border'}`}>
        <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 cursor-pointer" onClick={() => onViewProfile(sender)}>
                    <UserAvatar user={sender} />
                </div>
            </div>
            <div className="flex-1">
                <p className="text-primary text-sm leading-relaxed">
                    <strong className="hover:underline cursor-pointer" onClick={() => onViewProfile(sender)}>{sender?.name || 'User'}</strong>
                    <span className="text-secondary"> @{sender?.username || 'unknown'} </span>
                    {renderText()}
                </p>
                <p className="text-xs text-secondary mt-1">{timeAgo(notification.timestamp)}</p>
            </div>
        </div>
        <div className="mt-3 flex justify-end">
            <button onClick={handleClick} className="text-sm font-semibold bg-accent/10 text-accent px-4 py-1.5 rounded-lg hover:bg-accent/20 transition-colors">
                View Details
            </button>
        </div>
    </div>
  );
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
  const { setNotifications } = useSocket();
  
  const markAsRead = useCallback(async () => {
    try {
        await api.markNotificationsRead();
        setNotifications(prev => prev.map(n => ({...n, read: true})));
    } catch (error) {}
  }, [setNotifications]);

  useEffect(() => {
    if (notifications.some(n => !n.read)) markAsRead();
  }, [notifications, markAsRead]);
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6 font-display">Notifications</h1>
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationItem 
                key={notification.id} 
                notification={notification}
                allTribes={allTribes}
                onViewProfile={onViewProfile} 
                onViewMessage={onViewMessage}
                onViewPost={onViewPost}
                onViewTribe={onViewTribe}
                onViewStory={onViewStory}
            />
          ))
        ) : (
          <div className="bg-surface rounded-2xl border border-border text-center text-secondary p-12">
            <p>You have no notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;