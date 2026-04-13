

import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, User, Tribe } from '../../types';
import UserAvatar from '../common/UserAvatar';
import * as api from '../../api';
import { useSocket } from '../../contexts/SocketContext';

interface NotificationsPageProps {
  notifications: Notification[];
  allTribes: Tribe[];
  currentUser: User;
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
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const NotificationItem: React.FC<{ notification: Notification; allTribes: Tribe[]; currentUser: User; onViewProfile: (user: User) => void; onViewMessage: (user: User) => void; onViewPost: (postId: string) => void; onViewTribe: (tribe: any) => void; onViewStory: (userId: string) => void; }> = ({ notification, allTribes, currentUser, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
  const { sender, type, timestamp } = notification;

  const renderText = () => {
    switch (type) {
      case 'follow':
        return 'started following you.';
      case 'like':
        return 'liked your post.';
      case 'comment':
        return 'commented on your post.';
      case 'message':
        return 'sent you a message.';
      case 'story_like':
        return 'liked your story.';
      case 'tribe_join':
        const tribe = allTribes.find(t => t.id === notification.tribeId);
        return `joined your tribe: ${tribe?.name || ''}`;
      case 'tribe_message':
        return notification.text || 'sent a message in your tribe.';
      case 'admin_action':
        return notification.text || 'sent an admin update.';
      default:
        return '';
    }
  };

  const getDetailsText = () => {
    switch (notification.type) {
      case 'follow': return 'View Profile';
      case 'message': return 'View Message';
      case 'like': return 'View Post';
      case 'comment': return 'View Post';
      case 'story_like': return 'View Story';
      case 'tribe_join': return 'View Tribe';
      case 'tribe_message': return 'View Tribe';
      case 'admin_action': return notification.postId ? 'View Post' : 'View Details';
      default: return 'View Details';
    }
  };

  const handleClick = () => {
    switch (type) {
      case 'follow':
        onViewProfile(sender);
        break;
      case 'story_like':
        // If someone liked MY story, I should view MY story to see the like
        // Current behavior (bug): onViewStory(sender.id) -> Views the liker's story
        // New behavior (fix): onViewStory(currentUser.id) -> Views my story
        if (currentUser) {
          onViewStory(currentUser.id);
        }
        break;
      case 'message':
        // ... rest of switch ...
        onViewMessage(sender);
        break;
      case 'like':
      case 'comment':
        if (notification.postId) onViewPost(notification.postId);
        break;
      case 'tribe_join':
        if (notification.tribeId) {
          const tribe = allTribes.find(t => t.id === notification.tribeId);
          if (tribe) onViewTribe(tribe);
        }
        break;
      case 'tribe_message':
        if (notification.tribeId) {
          const tribe = allTribes.find(t => t.id === notification.tribeId);
          if (tribe) onViewTribe(tribe);
        }
        break;
      case 'admin_action':
        if (notification.postId) {
          onViewPost(notification.postId);
        }
        break;
    }
  };

  const Icon = {
    like: <HeartIcon />,
    comment: <CommentIcon />,
    follow: <FollowIcon />,
    message: <MessageIcon />,
    story_like: <StoryLikeIcon />,
    tribe_join: <TribeIcon />,
    tribe_message: <TribeIcon />,
    admin_action: <AdminIcon />,
  }[notification.type];

  return (
    <div className={`bg-surface rounded-2xl border shadow-sm p-4 transition-colors ${!notification.read ? 'border-accent/50' : 'border-border'}`}>
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 cursor-pointer" onClick={(e) => { e.stopPropagation(); if (sender) onViewProfile(sender); }}>
            {sender && <UserAvatar user={sender} />}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-surface p-0.5 rounded-full ring-2 ring-surface">
            <div className="w-5 h-5 text-accent">
              {Icon}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-primary text-sm leading-relaxed">
            <strong className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (sender) onViewProfile(sender); }}>{sender ? sender.name : 'Unknown User'}</strong>
            <span className="text-secondary"> @{sender ? sender.username : '...'} </span>
            {renderText()}
          </p>
          <p className="text-xs text-secondary mt-1">{timeAgo(timestamp)}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleClick}
          className="text-sm font-semibold bg-accent/10 text-accent px-4 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
        >
          {getDetailsText()}
        </button>
      </div>
    </div>
  );
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, allTribes, currentUser, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
  const navigate = useNavigate();
  const { setNotifications } = useSocket();
  const [cachedNotifications, setCachedNotifications] = useState<Notification[]>([]);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from cache immediately on mount
  useEffect(() => {
    const cached = localStorage.getItem('tribe_storage_notifications');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCachedNotifications(parsed);
        }
      } catch (error) {
        console.error('Failed to parse cached notifications', error);
      }
    }
    setIsLoadingFromCache(false);
  }, []);

  // Update cache when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      try {
        localStorage.setItem('tribe_storage_notifications', JSON.stringify(notifications.slice(0, 50)));
      } catch (error) {
        console.error('Failed to cache notifications', error);
      }
    }
  }, [notifications]);

  const markAsRead = useCallback(async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  }, [setNotifications]);

  useEffect(() => {
    // Mark as read immediately if there are unread notifications
    if (notifications.some(n => !n.read)) {
      markAsRead();
    }
  }, [notifications, markAsRead]);

  // Use cached notifications if available and real notifications haven't loaded yet
  const displayNotifications = (notifications.length > 0 ? notifications : cachedNotifications).filter(notification => {
    if (!searchQuery.trim()) return true;
    const lowerQ = searchQuery.toLowerCase();
    
    // Extracted render logic to search by content
    let text = '';
    switch (notification.type) {
      case 'follow': text = 'started following you.'; break;
      case 'like': text = 'liked your post.'; break;
      case 'comment': text = 'commented on your post.'; break;
      case 'message': text = 'sent you a message.'; break;
      case 'story_like': text = 'liked your story.'; break;
      case 'tribe_join':
        const tribe = allTribes.find(t => t.id === notification.tribeId);
        text = `joined your tribe: ${tribe?.name || ''}`; break;
      case 'tribe_message': text = notification.text || 'sent a message in your tribe.'; break;
      case 'admin_action': text = notification.text || 'sent an admin update.'; break;
    }
    
    return (notification.sender?.name?.toLowerCase() || '').includes(lowerQ) ||
           (notification.sender?.username?.toLowerCase() || '').includes(lowerQ) ||
           text.toLowerCase().includes(lowerQ);
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[28px] font-bold text-primary mb-6 font-display leading-[1.2]">Notifications</h1>
      
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Search notifications..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-4 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {displayNotifications.length > 0 ? (
          displayNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              allTribes={allTribes}
              currentUser={currentUser}
              onViewProfile={onViewProfile}
              onViewMessage={onViewMessage}
              onViewPost={onViewPost}
              onViewTribe={onViewTribe}
              onViewStory={onViewStory}
            />
          ))
        ) : (
          <div className="bg-surface rounded-2xl border border-border shadow-md text-center text-secondary p-8">
            <p>{searchQuery.trim() ? "No notifications match your search." : (isLoadingFromCache ? 'Loading notifications...' : 'You have no notifications yet.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ICONS ---
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="w-full h-full">{children}</div>;
const HeartIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></IconWrapper>;
const StoryLikeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></IconWrapper>;
const CommentIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg></IconWrapper>;
const FollowIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12a9.99 9.99 0 00-6.535 2.493z" /></svg></IconWrapper>;
const MessageIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg></IconWrapper>;
// New Standard User Group Icon
const TribeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg></IconWrapper>;
const AdminIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a2 2 0 011.447.618l5 5A2 2 0 0117 9v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 01.553-1.382l5-5A2 2 0 0110 2zm0 3.414L6 9.414V15h8V9.414l-4-4z" /></svg></IconWrapper>;

export default NotificationsPage;
