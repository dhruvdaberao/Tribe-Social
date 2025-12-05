




// import React, { useEffect, useCallback } from 'react';
// import { Notification, User, Tribe } from '../../types';
// import UserAvatar from '../common/UserAvatar';
// import * as api from '../../api.ts';
// import { useSocket } from '../../contexts/SocketContext';

// interface NotificationsPageProps {
//   notifications: Notification[];
//   allTribes: Tribe[];
//   onViewProfile: (user: User) => void;
//   onViewMessage: (user: User) => void;
//   onViewPost: (postId: string) => void;
//   onViewTribe: (tribe: Tribe) => void;
//   onViewStory: (userId: string) => void;
// }

// const timeAgo = (dateString: string) => {
//     if (!dateString) return '...';
//     const date = new Date(dateString);
//     const now = new Date();
//     const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
//     const minutes = Math.round(seconds / 60);
//     const hours = Math.round(minutes / 60);
//     const days = Math.round(hours / 24);

//     if (seconds < 60) return `${seconds}s ago`;
//     if (minutes < 60) return `${minutes}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     if (days < 7) return `${days}d ago`;
//     return date.toLocaleDateString();
// };

// const NotificationItem: React.FC<{ notification: Notification; allTribes: Tribe[]; onViewProfile: (user: User) => void; onViewMessage: (user: User) => void; onViewPost: (postId: string) => void; onViewTribe: (tribe: any) => void; onViewStory: (userId: string) => void; }> = ({ notification, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
//   const { sender, type, timestamp } = notification;

//   const renderText = () => {
//     switch (type) {
//       case 'follow':
//         return 'started following you.';
//       case 'like':
//         return 'liked your post.';
//       case 'comment':
//         return 'commented on your post.';
//       case 'message':
//         return 'sent you a message.';
//       case 'story_like':
//         return 'liked your story.';
//       case 'tribe_join':
//         const tribe = allTribes.find(t => t.id === notification.tribeId);
//         return `joined your tribe: ${tribe?.name || ''}`;
//       default:
//         return '';
//     }
//   };
  
//   const getDetailsText = () => {
//     switch (notification.type) {
//         case 'follow': return 'View Profile';
//         case 'message': return 'View Message';
//         case 'like': return 'View Post';
//         case 'comment': return 'View Post';
//         case 'story_like': return 'View Story';
//         case 'tribe_join': return 'View Tribe';
//         default: return 'View Details';
//     }
//   };
  
//   const handleClick = () => {
//     switch (type) {
//         case 'follow':
//             onViewProfile(sender);
//             break;
//         case 'story_like':
//             onViewStory(sender.id);
//             break;
//         case 'message':
//             onViewMessage(sender);
//             break;
//         case 'like':
//         case 'comment':
//             if (notification.postId) onViewPost(notification.postId);
//             break;
//         case 'tribe_join':
//             if (notification.tribeId) {
//                 const tribe = allTribes.find(t => t.id === notification.tribeId);
//                 if (tribe) onViewTribe(tribe);
//             }
//             break;
//     }
//   };

//   const Icon = {
//     like: <HeartIcon />,
//     comment: <CommentIcon />,
//     follow: <FollowIcon />,
//     message: <MessageIcon />,
//     story_like: <StoryLikeIcon/>,
//     tribe_join: <TribeIcon />,
//   }[notification.type];

//   return (
//     <div className={`bg-surface rounded-2xl border shadow-sm p-4 transition-colors ${!notification.read ? 'border-accent/50' : 'border-border'}`}>
//         <div className="flex items-start space-x-4">
//             <div className="relative flex-shrink-0">
//                 <div className="w-12 h-12 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(sender);}}>
//                     <UserAvatar user={sender} />
//                 </div>
//                 <div className="absolute -bottom-1 -right-1 bg-surface p-0.5 rounded-full ring-2 ring-surface">
//                     <div className="w-5 h-5 text-accent">
//                         {Icon}
//                     </div>
//                 </div>
//             </div>

//             <div className="flex-1">
//                 <p className="text-primary text-sm leading-relaxed">
//                     <strong className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(sender);}}>{sender.name}</strong>
//                     <span className="text-secondary"> @{sender.username} </span>
//                     {renderText()}
//                 </p>
//                 <p className="text-xs text-secondary mt-1">{timeAgo(timestamp)}</p>
//             </div>
//         </div>
//         <div className="mt-3 flex justify-end">
//             <button
//                 onClick={handleClick}
//                 className="text-sm font-semibold bg-accent/10 text-accent px-4 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
//             >
//                 {getDetailsText()}
//             </button>
//         </div>
//     </div>
//   );
// };

// const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
//   const { setNotifications } = useSocket();
  
//   const markAsRead = useCallback(async () => {
//     try {
//         if (notifications.some(n => !n.read)) {
//             await api.markNotificationsRead();
//             setNotifications(prev => prev.map(n => ({...n, read: true})));
//         }
//     } catch (error) {
//         console.error("Failed to mark notifications as read", error);
//     }
//   }, [notifications, setNotifications]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//         markAsRead();
//     }, 2000); 

//     return () => clearTimeout(timer);
//   }, [markAsRead]);
  
//   return (
//     <div className="max-w-3xl mx-auto">
//       <h1 className="text-2xl font-bold text-primary mb-6 font-display">Notifications</h1>
//       <div className="space-y-3">
//         {notifications.length > 0 ? (
//           notifications.map(notification => (
//             <NotificationItem 
//                 key={notification.id} 
//                 notification={notification}
//                 allTribes={allTribes}
//                 onViewProfile={onViewProfile} 
//                 onViewMessage={onViewMessage}
//                 onViewPost={onViewPost}
//                 onViewTribe={onViewTribe}
//                 onViewStory={onViewStory}
//             />
//           ))
//         ) : (
//           <div className="bg-surface rounded-2xl border border-border shadow-md text-center text-secondary p-8">
//             <p>You have no notifications yet.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // --- ICONS ---
// const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="w-full h-full">{children}</div>;
// const HeartIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></IconWrapper>;
// const StoryLikeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></IconWrapper>;
// const CommentIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg></IconWrapper>;
// const FollowIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12a9.99 9.99 0 00-6.535 2.493z" /></svg></IconWrapper>;
// const MessageIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg></IconWrapper>;
// const TribeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 019 12a3.75 3.75 0 015.25 3.22c.034.166.052.338.052.512v3.223A4.5 4.5 0 018.25 18.75a4.5 4.5 0 01-1.887-1.124l-2.8-2.033a.75.75 0 00-1.28.638v2.873a.75.75 0 001.28.638l2.8-2.033a4.5 4.5 0 016.364-2.243" /></svg></IconWrapper>;

// export default NotificationsPage;













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
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const NotificationItem: React.FC<{ notification: Notification; allTribes: Tribe[]; onViewProfile: (user: User) => void; onViewMessage: (user: User) => void; onViewPost: (postId: string) => void; onViewTribe: (tribe: any) => void; onViewStory: (userId: string) => void; }> = ({ notification, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
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
        default: return 'View Details';
    }
  };
  
  const handleClick = () => {
    switch (type) {
        case 'follow':
            onViewProfile(sender);
            break;
        case 'story_like':
            onViewStory(sender.id);
            break;
        case 'message':
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
    }
  };

  const Icon = {
    like: <HeartIcon />,
    comment: <CommentIcon />,
    follow: <FollowIcon />,
    message: <MessageIcon />,
    story_like: <StoryLikeIcon/>,
    tribe_join: <TribeIcon />,
  }[notification.type];

  return (
    <div className={`bg-surface rounded-2xl border shadow-sm p-4 transition-colors ${!notification.read ? 'border-accent/50' : 'border-border'}`}>
        <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(sender);}}>
                    <UserAvatar user={sender} />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-surface p-0.5 rounded-full ring-2 ring-surface">
                    <div className="w-5 h-5 text-accent">
                        {Icon}
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <p className="text-primary text-sm leading-relaxed">
                    <strong className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(sender);}}>{sender.name}</strong>
                    <span className="text-secondary"> @{sender.username} </span>
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

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, allTribes, onViewProfile, onViewMessage, onViewPost, onViewTribe, onViewStory }) => {
  const { setNotifications } = useSocket();
  
  const markAsRead = useCallback(async () => {
    try {
        await api.markNotificationsRead();
        setNotifications(prev => prev.map(n => ({...n, read: true})));
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
          <div className="bg-surface rounded-2xl border border-border shadow-md text-center text-secondary p-8">
            <p>You have no notifications yet.</p>
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
const TribeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 019 12a3.75 3.75 0 015.25 3.22c.034.166.052.338.052.512v3.223A4.5 4.5 0 018.25 18.75a4.5 4.5 0 01-1.887-1.124l-2.8-2.033a.75.75 0 00-1.28.638v2.873a.75.75 0 001.28.638l2.8-2.033a4.5 4.5 0 016.364-2.243" /></svg></IconWrapper>;

export default NotificationsPage;