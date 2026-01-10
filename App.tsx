import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { User, Post, Tribe, Story } from './types';
import * as api from './api';

import Sidebar from './components/layout/Sidebar';
import FeedPage from './components/feed/FeedPage';
import { ProfilePage } from './components/profile/ProfilePage';
import ChatPage from './components/chat/ChatPage';
import DiscoverPage from './components/discover/DiscoverPage';
import LoginPage from './components/auth/LoginPage';
import TribesPage from './components/tribes/TribesPage';
import TribeDetailPage from './components/tribes/TribeDetailPage';
import CreatePost from './components/feed/CreatePost';
import NotificationsPage from './components/notifications/NotificationsPage';
import SettingsPage from './components/settings/SettingsPage';
import StoryFeed from './components/stories/StoryFeed';
import { Toaster, toast } from './components/common/Toast';

export type NavItem =
  | 'Home'
  | 'Discover'
  | 'Messages'
  | 'Tribes'
  | 'TribeDetail'
  | 'Notifications'
  | 'Profile'
  | 'Settings';

const App: React.FC = () => {
  const { currentUser, logout, isLoading: isAuthLoading } = useAuth();
  const {
    socket,
    notifications,
    unreadMessageCount,
    unreadTribeCount,
    unreadNotificationCount,
  } = useSocket();

  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [followingUserStories, setFollowingUserStories] = useState<
    { user: User; stories: Story[] }[]
  >([]);

  const [activeNavItem, setActiveNavItem] = useState<NavItem>('Home');
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [viewedTribe, setViewedTribe] = useState<Tribe | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  /* ================= USER MAP ================= */
  const userMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u]));
  }, [users]);

  /* ================= INITIAL LOAD ================= */
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [u, p, t, ms, fs] = await Promise.all([
        api.fetchUsers(),
        api.fetchFeedPosts(),
        api.fetchTribes(),
        api.fetchMyStories(),
        api.fetchFollowingStories(),
      ]);

      setUsers(u.data || []);
      setPosts(p.data || []);
      setTribes(t.data || []);
      setMyStories(ms.data || []);
      setFollowingUserStories(fs.data || []);
      setIsDataLoaded(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load app data');
    }
  }, [currentUser]);

  /* ================= PROFILE ================= */
  const handleViewProfile = async (user: User) => {
    setViewedUser(user);
    setActiveNavItem('Profile');
    try {
      const { data } = await api.fetchUserPosts(user.id);
      setProfilePosts(data || []);
    } catch {
      setProfilePosts([]);
    }
  };

  /* ================= POSTS ================= */
  const handleLikePost = async (postId: string) => {
    try {
      const { data } = await api.likePost(postId);
      setPosts((p) => p.map((x) => (x.id === postId ? data : x)));
      setProfilePosts((p) => p.map((x) => (x.id === postId ? data : x)));
    } catch {
      toast.error('Like failed');
    }
  };

  const handleCommentPost = async (postId: string, text: string) => {
    try {
      const { data } = await api.commentOnPost(postId, { text });
      setPosts((p) => p.map((x) => (x.id === postId ? data : x)));
      setProfilePosts((p) => p.map((x) => (x.id === postId ? data : x)));
    } catch {
      toast.error('Comment failed');
    }
  };

  /* ================= FOLLOW / JOIN ================= */
  const handleToggleFollow = async (userId: string) => {
    await api.toggleFollow(userId);
    const u = await api.fetchUsers();
    setUsers(u.data || []);
  };

  const handleJoinTribe = async (tribeId: string) => {
    await api.joinTribe(tribeId);
    const t = await api.fetchTribes();
    setTribes(t.data || []);
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    if (!isAuthLoading && currentUser) fetchData();
  }, [isAuthLoading, currentUser, fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('newPost', (post: Post) => {
      setPosts((p) => [post, ...p]);
    });
    return () => {
      socket.off('newPost');
    };
  }, [socket]);

  if (isAuthLoading) {
    return <div className="h-screen flex items-center justify-center" />;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

const visiblePosts = posts.filter(
  (p) =>
    p.author &&
    Array.isArray(currentUser.blockedUsers) &&
    !currentUser.blockedUsers.includes(p.author.id)
);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-background text-primary">
      <Toaster />

      <Sidebar
        activeItem={activeNavItem}
        onSelectItem={(i) => {
          if (i === 'Profile') handleViewProfile(currentUser);
          else setActiveNavItem(i);
        }}
        currentUser={currentUser}
        unreadMessageCount={unreadMessageCount}
        unreadTribeCount={unreadTribeCount}
        unreadNotificationCount={unreadNotificationCount}
      />

      <main className="pt-16">
        {activeNavItem === 'Home' && (
          <>
            <CreatePost
              currentUser={currentUser}
              onAddPost={fetchData}
              isPosting={false}
            />

            <StoryFeed
              myStories={myStories}
              followingUserStories={followingUserStories}
              currentUser={currentUser}
              seenStoryAuthors={new Set()}
              onViewUserStories={() => {}}
            />

            {visiblePosts.length === 0 && isDataLoaded && (
              <div className="text-center py-10">No posts yet 🐣</div>
            )}

            <FeedPage
              posts={visiblePosts}
              currentUser={currentUser}
              allUsers={users}
              allTribes={tribes}
              onLikePost={handleLikePost}
              onCommentPost={handleCommentPost}
              onViewProfile={handleViewProfile}
              onDeletePost={() => {}}
              onDeleteComment={() => {}}
              onSharePost={() => {}}
            />
          </>
        )}

        {activeNavItem === 'Discover' && (
          <DiscoverPage
            posts={visiblePosts}
            users={users}
            tribes={tribes}
            currentUser={currentUser}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
            onToggleFollow={handleToggleFollow}
            onViewProfile={handleViewProfile}
            onViewTribe={(t) => {
              setViewedTribe(t);
              setActiveNavItem('TribeDetail');
            }}
            onJoinToggle={handleJoinTribe}
          />
        )}

        {activeNavItem === 'Messages' && (
          <ChatPage
            currentUser={currentUser}
            allUsers={users}
            initialTargetUser={null}
            onViewProfile={handleViewProfile}
          />
        )}

        {activeNavItem === 'Tribes' && (
          <TribesPage
            tribes={tribes}
            currentUser={currentUser}
            onJoinToggle={handleJoinTribe}
            onViewTribe={(t) => {
              setViewedTribe(t);
              setActiveNavItem('TribeDetail');
            }}
          />
        )}

        {activeNavItem === 'TribeDetail' && viewedTribe && (
          <TribeDetailPage
            tribe={viewedTribe}
            currentUser={currentUser}
            userMap={userMap}
            onSendMessage={(tribeId, text) =>
              api.sendTribeMessage(tribeId, { text })
            }
            onDeleteMessage={(tribeId, messageId) =>
              api.deleteTribeMessage(tribeId, messageId)
            }
            onJoinToggle={handleJoinTribe}
            onBack={() => setActiveNavItem('Tribes')}
            onViewProfile={handleViewProfile}
            onEditTribe={() => {}}
            onDeleteTribe={() => {}}
          />
        )}

        {activeNavItem === 'Notifications' && (
          <NotificationsPage notifications={notifications} />
        )}

        {activeNavItem === 'Profile' && viewedUser && (
          <ProfilePage
            user={viewedUser}
            posts={profilePosts}
            currentUser={currentUser}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
            onToggleFollow={handleToggleFollow}
            onViewProfile={handleViewProfile}
          />
        )}

        {activeNavItem === 'Settings' && (
          <SettingsPage currentUser={currentUser} onLogout={logout} />
        )}
      </main>
    </div>
  );
};

export default App;
