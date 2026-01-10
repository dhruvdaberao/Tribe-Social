import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { User, Post, Tribe, Notification as NotificationType, Story } from './types';
import * as api from './api';

// Components
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

export type NavItem = 'Home' | 'Discover' | 'Messages' | 'Tribes' | 'Notifications' | 'Profile' | 'Chuk' | 'TribeDetail' | 'Settings';

const CHUK_AI_USER: User = {
    id: 'chuk-ai', name: 'Chuk', username: 'chuk_the_chicken', avatarUrl: '/chuk.gif', bannerUrl: null,
    bio: 'Your personal guide & friend at Tribe! 🐣', followers: [], following: [], blockedUsers: [],
};

const App: React.FC = () => {
    const { currentUser, setCurrentUser, logout, isLoading: isAuthLoading } = useAuth();
    const { socket, notifications, setNotifications, unreadMessageCount, unreadTribeCount, unreadNotificationCount } = useSocket();
    
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [profilePosts, setProfilePosts] = useState<Post[]>([]);
    const [tribes, setTribes] = useState<Tribe[]>([]);
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [followingUserStories, setFollowingUserStories] = useState<{ user: User, stories: Story[] }[]>([]);
    
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [activeNavItem, setActiveNavItem] = useState<NavItem>('Home');
    const [viewedUser, setViewedUser] = useState<User | null>(null);
    const [viewedTribe, setViewedTribe] = useState<Tribe | null>(null);

    const userMap = useMemo(() => {
        const map = new Map(users.map((user: User) => [user.id, user]));
        map.set(CHUK_AI_USER.id, CHUK_AI_USER);
        return map;
    }, [users]);

    // NORMALIZATION: Treat 'author' and 'user' as same to handle inconsistent backend schemas
    const normalizePost = useCallback((p: any): Post => {
        const authorObj = p.author || p.user || { name: 'Anonymous', id: 'deleted', username: 'anon' };
        return {
            ...p,
            id: p.id || p._id, // Ensure internal ID is mapped to standard 'id'
            author: authorObj,
            comments: (p.comments || []).map((c: any) => ({ ...c, author: c.author || c.user || { name: 'User' } }))
        };
    }, []);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        try {
            const [uRes, fRes, tRes, sRes, fsRes] = await Promise.all([
                api.fetchUsers().catch(e => ({ data: [] })),
                api.fetchFeedPosts(1, 30).catch(e => ({ data: [] })),
                api.fetchTribes().catch(e => ({ data: [] })),
                api.fetchMyStories().catch(e => ({ data: [] })),
                api.fetchFollowingStories().catch(e => ({ data: [] }))
            ]);
            setUsers(uRes.data || []);
            setPosts((fRes.data || []).map(normalizePost));
            setTribes(tRes.data || []);
            setMyStories(sRes.data || []);
            setFollowingUserStories(fsRes.data || []);
            setIsDataLoaded(true);
        } catch (e) {
            console.error("Critical Load Error", e);
        }
    }, [currentUser, normalizePost]);

    const handleViewProfile = async (user: User) => {
        setViewedUser(user);
        setActiveNavItem('Profile');
        setProfilePosts([]); // Clear to show loading state/prevent ghosting
        try {
            // First attempt specific profile API
            const { data } = await api.fetchUserPosts(user.id);
            if (data && data.length > 0) {
                setProfilePosts(data.map(normalizePost));
            } else {
                // FALLBACK: Filter from existing feed posts if API returns empty
                const filtered = posts.filter(p => (p.author?.id || (p.author as any)?._id) === user.id);
                setProfilePosts(filtered);
            }
        } catch (e) {
            const filtered = posts.filter(p => (p.author?.id || (p.author as any)?._id) === user.id);
            setProfilePosts(filtered);
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!postId || postId === 'undefined') return;
        try {
            const { data } = await api.likePost(postId);
            const updated = normalizePost(data);
            // Update BOTH lists to keep UI consistent
            setPosts(prev => prev.map(p => p.id === postId ? updated : p));
            setProfilePosts(prev => prev.map(p => p.id === postId ? updated : p));
        } catch (e) { 
            toast.error("Action failed"); 
        }
    };

    const handleCommentPost = async (postId: string, text: string) => {
        if (!postId || postId === 'undefined') return;
        try {
            const { data } = await api.commentOnPost(postId, { text });
            const updated = normalizePost(data);
            setPosts(prev => prev.map(p => p.id === postId ? updated : p));
            setProfilePosts(prev => prev.map(p => p.id === postId ? updated : p));
        } catch (e) { toast.error("Comment failed"); }
    };

    useEffect(() => {
        if (!isAuthLoading && currentUser) fetchData();
    }, [isAuthLoading, currentUser, fetchData]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newPost', (post: any) => {
            setPosts(prev => [normalizePost(post), ...prev]);
        });
        return () => { socket.off('newPost'); };
    }, [socket, normalizePost]);

    if (isAuthLoading) return <div className="h-screen bg-background flex items-center justify-center"><img src="/duckload.gif" className="w-16" /></div>;
    if (!currentUser) return <LoginPage />;
    
    // Defensive filtering: Ensure p.author exists before checking ID
    const visiblePosts = posts.filter(p => p && p.author?.id && !(currentUser.blockedUsers || []).includes(p.author.id));

    return (
        <div className="bg-background min-h-screen text-primary overflow-hidden">
            <Toaster />
            <Sidebar activeItem={activeNavItem} onSelectItem={(i) => { 
                if (i === 'Profile') handleViewProfile(currentUser);
                else if (i === 'Chuk') setActiveNavItem('Messages'); // Force Chuk assistant into chat
                else setActiveNavItem(i); 
            }} currentUser={currentUser} unreadMessageCount={unreadMessageCount} unreadTribeCount={unreadTribeCount} unreadNotificationCount={unreadNotificationCount} />
            <main className="pt-16 pb-16 md:pb-0">
                <div className={['Messages', 'TribeDetail', 'Settings', 'Notifications'].includes(activeNavItem) ? 'h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]' : 'max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8'}>
                    {activeNavItem === 'Home' && (
                        <>
                            <CreatePost currentUser={currentUser} allUsers={users} myStories={myStories} onAddPost={fetchData} isPosting={false} onOpenStoryCreator={()=>{}} onViewUserStories={()=>{}} />
                            <StoryFeed myStories={myStories} followingUserStories={followingUserStories} currentUser={currentUser} seenStoryAuthors={new Set()} onViewUserStories={()=>{}} />
                            {visiblePosts.length === 0 && isDataLoaded && <div className="text-center py-20 text-secondary">Looking for posts... Check Discover! 🐣</div>}
                            <FeedPage posts={visiblePosts} currentUser={currentUser} allUsers={users} allTribes={tribes} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={()=>{}} onDeleteComment={()=>{}} onViewProfile={handleViewProfile} onSharePost={()=>{}} />
                        </>
                    )}
                    {activeNavItem === 'Discover' && <DiscoverPage posts={visiblePosts} users={users} tribes={tribes} currentUser={currentUser} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={()=>{}} onDeleteComment={()=>{}} onToggleFollow={()=>{}} onViewProfile={handleViewProfile} onViewTribe={(t)=>{ setViewedTribe(t); setActiveNavItem('TribeDetail'); }} onJoinToggle={()=>{}} onEditTribe={()=>{}} onSharePost={()=>{}} onLoadMore={()=>{}} />}
                    {activeNavItem === 'Messages' && <ChatPage currentUser={currentUser} allUsers={users} chukUser={CHUK_AI_USER} initialTargetUser={null} onViewProfile={handleViewProfile} onSharePost={()=>{}} />}
                    {activeNavItem === 'Tribes' && <TribesPage tribes={tribes} currentUser={currentUser} onJoinToggle={()=>{}} onCreateTribe={()=>{}} onViewTribe={(t)=>{ setViewedTribe(t); setActiveNavItem('TribeDetail'); }} onEditTribe={()=>{}} />}
                    {activeNavItem === 'TribeDetail' && viewedTribe && <TribeDetailPage tribe={viewedTribe} currentUser={currentUser} userMap={userMap} onSendMessage={()=>{}} onDeleteMessage={()=>{}} onDeleteTribe={()=>{}} onBack={()=>setActiveNavItem('Tribes')} onViewProfile={handleViewProfile} onEditTribe={()=>{}} onJoinToggle={()=>{}} />}
                    {activeNavItem === 'Notifications' && <NotificationsPage notifications={notifications} allTribes={tribes} onViewProfile={handleViewProfile} onViewMessage={()=>{}} onViewPost={()=>{}} onViewTribe={()=>{}} onViewStory={()=>{}} />}
                    {activeNavItem === 'Profile' && viewedUser && <ProfilePage user={viewedUser} allUsers={users} visibleUsers={users} allTribes={tribes} posts={profilePosts} currentUser={currentUser} hasStory={false} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={()=>{}} onDeleteComment={()=>{}} onViewProfile={handleViewProfile} onUpdateUser={()=>{}} onAddPost={fetchData} isPosting={false} onToggleFollow={()=>{}} onStartConversation={()=>{}} onNavigate={(i)=>setActiveNavItem(i)} onSharePost={()=>{}} onOpenStoryCreator={()=>{}} myStories={[]} onViewUserStories={()=>{}} />}
                    {activeNavItem === 'Settings' && <SettingsPage currentUser={currentUser} allUsers={users} onLogout={logout} onDeleteAccount={()=>{}} onToggleBlock={()=>{}} onBack={() => setActiveNavItem('Profile')} />}
                </div>
            </main>
        </div>
    );
};

export default App;