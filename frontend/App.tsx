
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { GlobalContentProvider, useGlobalContent } from './contexts/GlobalContentContext';
import { safeSetItem, safeClear } from './utils/safeLocalStorage';
import { User, Post, Tribe, TribeMessage, Notification as NotificationType, Comment, Story } from './types';
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
import EditTribeModal from './components/tribes/EditTribeModal';
import CreatePost from './components/feed/CreatePost';
import NotificationsPage from './components/notifications/NotificationsPage';
import SettingsPage from './components/settings/SettingsPage';
import AccountPage from './components/settings/AccountPage';
import HelpPage from './components/settings/HelpPage';
import AboutPage from './components/settings/AboutPage';
import RulesPoliciesPage from './pages/RulesPoliciesPage';
import StoryCreator from './components/stories/StoryCreator';
import StoryViewer from './components/stories/StoryViewer';
import StoryFeed from './components/stories/StoryFeed';
import { Toaster, toast } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import PostViewModal from './components/profile/PostViewModal';
import ReportModal from './components/moderation/ReportModal';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminTribesPage from './pages/admin/AdminTribesPage';
import SuperAdminPage from './pages/admin/SuperAdminPage';

export type NavItem = 'Home' | 'Discover' | 'Messages' | 'Tribes' | 'Notifications' | 'Profile' | 'Psyduck' | 'TribeDetail' | 'Settings';

const PSYDUCK_USER: User = {
    id: 'chuk-ai',
    name: 'Psyduck',
    username: 'psyduck',
    avatarUrl: '/chuk-ai.png',
    bannerUrl: null,
    bio: 'Psy... yi... yi... (Your goofy Tribe assistant) 🦆✨',
    followers: [],
    following: [],
    blockedUsers: [],
};

const MainLayout: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { unreadMessageCount, unreadTribeCount, unreadNotificationCount, clearUnreadTribe, notifications, unreadCounts } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();

    // Global State
    const {
        users, posts, tribes, myStories, followingUserStories,
        isDataLoaded, isFetching, isCreatingPost,
        feedPage, feedHasMore, discoverPage, discoverHasMore, isLoadingMore,
        userMap, visiblePosts, visibleUsers,
        viewingPost, setViewingPost,
        viewingUserStories, setViewingUserStories,
        isCreatingStory, setIsCreatingStory,
        editingTribe, setEditingTribe,
        fetchFeed, fetchTribes, handleLoadMoreFeed, handleLoadMoreDiscover,
        handleAddPost, handleLikePost, handleCommentPost, handleDeletePost, handleHidePost, handleDeleteComment, handleSharePost,
        handleToggleFollow, handleToggleBlock, handleUpdateUser, handleDeleteAccount,
        handleJoinToggle, handleCreateTribe, handleEditTribe, handleDeleteTribe,
        handleCreateStory, handleDeleteStory, handleLikeStory,
        handleViewPost, handleViewUserStories
    } = useGlobalContent();

    // Local UI State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const mainRef = useRef<HTMLDivElement>(null);
    const [viewedTribe, setViewedTribe] = useState<Tribe | null>(null); // Keep locally for syncing with TribeDetail if used as prop, but Router handles ID usually.
    const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'user'; id: string } | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
    // Actually TribeDetail fetches its own data or uses props. 
    // In monolithic App.tsx, viewedTribe was used to pass to TribeDetail.
    // Let's rely on TribeDetail logic, but we might need to pass partial tribe data if available.

    // Derived NavItem
    const getNavItemFromPath = (pathname: string): NavItem => {
        if (pathname === '/' || pathname === '/feed') return 'Home';
        if (pathname.startsWith('/discover')) return 'Discover';
        if (pathname.startsWith('/messages')) return 'Messages';
        if (pathname.startsWith('/tribes')) {
            // If simply /tribes -> Tribes
            // If /tribes/123 -> TribeDetail
            return pathname.split('/').filter(Boolean).length > 1 ? 'TribeDetail' : 'Tribes';
        }
        if (pathname.startsWith('/notifications')) return 'Notifications';
        if (pathname.startsWith('/profile')) return 'Profile';
        if (pathname.startsWith('/admin')) return 'Settings';
        if (pathname.startsWith('/settings')) return 'Settings';
        if (pathname.startsWith('/psyduck')) return 'Psyduck';
        return 'Home';
    };

    const activeNavItem = getNavItemFromPath(location.pathname);
    const isFullHeightPage = ['Messages', 'TribeDetail', 'Settings', 'Psyduck'].includes(activeNavItem);
    const isWidePage = ['Discover', 'Tribes', 'Profile'].includes(activeNavItem);

    // Lazy Data Loading Trigger
    useEffect(() => {
        if (activeNavItem === 'Home') fetchFeed();
        if (activeNavItem === 'Tribes') fetchTribes();
    }, [activeNavItem, fetchFeed, fetchTribes]);

    // Scroll Restoration & Management
    useEffect(() => {
        if (!isFullHeightPage) {
            window.scrollTo(0, 0); // Simple scroll top on route change for non-chat pages
        } else if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname, isFullHeightPage]);


    const handleNavigation = (item: NavItem) => {
        if (item === activeNavItem) {
            // Exception: If clicking Profile while on another user's profile, navigate instead of refreshing
            if (item === 'Profile') {
                const currentPathId = window.location.pathname.split('/').pop();
                if (currentPathId !== currentUser?.id) {
                    navigate(`/profile/${currentUser?.id}`);
                    return;
                }
            }
            // Exception: If clicking Profile while on another user's profile, navigate instead of refreshing
            if (item === 'Profile') {
                const currentPathId = window.location.pathname.split('/').pop();
                if (currentPathId !== currentUser?.id) {
                    navigate(`/profile/${currentUser?.id}`);
                    return;
                }
            }

            // Refresh Logic
            if (item === 'Home') fetchFeed();
            if (item === 'Tribes') fetchTribes();
            if (item === 'Notifications') toast.success('Refreshed'); // Socket handles it

            const isWindowScroll = window.scrollY > 0;
            const isMainRefScroll = mainRef.current && mainRef.current.scrollTop > 0;
            if (isWindowScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
            if (isMainRefScroll) mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Navigation Logic
        switch (item) {
            case 'Home': navigate('/'); break;
            case 'Discover': navigate('/discover'); break;
            case 'Messages': navigate('/messages'); break;
            case 'Tribes': navigate('/tribes'); break;
            case 'Notifications': navigate('/notifications'); break;
            case 'Profile': navigate(`/profile/${currentUser?.id}`); break;
            case 'Settings': navigate('/settings'); break;
            case 'Psyduck': navigate('/psyduck'); break;
            case 'TribeDetail': break; // Usually not clicked directly from sidebar
        }
    };


    // Render Helpers
    const containerClass = isFullHeightPage
        ? `h-[calc(100vh-${(activeNavItem === 'Messages' && !isChatOpen ? '8rem' : '4rem')})] md:h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar`
        : isWidePage ? 'max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8'
            : 'max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8';

    const shouldHideHeader = activeNavItem === 'TribeDetail' ||
        ((activeNavItem === 'Messages' || activeNavItem === 'Psyduck') && isChatOpen);

    const swipeTabs: NavItem[] = ['Home', 'Discover', 'Messages', 'Notifications', 'Profile'];

    const shouldIgnoreSwipe = (target: EventTarget | null) => {
        if (!(target instanceof HTMLElement)) return true;
        if (target.closest('input, textarea, select, button, a, [data-swipe-ignore="true"]')) return true;
        let element: HTMLElement | null = target;
        while (element) {
            const style = window.getComputedStyle(element);
            const hasHorizontalScroll = element.scrollWidth > element.clientWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll');
            if (hasHorizontalScroll) return true;
            element = element.parentElement;
        }
        return false;
    };

    const handleTouchStart = (event: React.TouchEvent) => {
        if (shouldIgnoreSwipe(event.target)) {
            swipeStartRef.current = null;
            return;
        }
        const touch = event.touches[0];
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (event: React.TouchEvent) => {
        if (!swipeStartRef.current) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - swipeStartRef.current.x;
        const dy = touch.clientY - swipeStartRef.current.y;
        swipeStartRef.current = null;

        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        const direction = dx > 0 ? 'right' : 'left';
        const currentIndex = swipeTabs.indexOf(activeNavItem);
        if (currentIndex === -1) return;
        const nextIndex = currentIndex + (direction === 'left' ? 1 : -1);
        if (nextIndex < 0 || nextIndex >= swipeTabs.length) return;

        setSwipeDirection(direction);
        window.setTimeout(() => {
            handleNavigation(swipeTabs[nextIndex]);
            setSwipeDirection(null);
        }, 120);
    };

    // Legacy wrappers for components expecting props
    // We pass handlers that forward to GlobalContent

    // View Profile Wrapper
    const handleViewProfile = (user: User) => {
        navigate(`/profile/${user.id}`);
    };

    const handleViewTribe = (tribe: Tribe) => {
        setViewedTribe(tribe); // cache for detail
        clearUnreadTribe(tribe.id);
        navigate(`/tribes/${tribe.id}`);
    };

    const handleStartConversation = (user: User) => {
        navigate('/messages', { state: { targetUser: user } });
    };

    const openReportModal = (type: 'post' | 'user', id: string) => {
        setReportTarget({ type, id });
    };

    const handleSubmitReport = async (payload: { reason: string; details: string }) => {
        if (!reportTarget) return;
        try {
            await api.createReport({
                targetType: reportTarget.type,
                targetId: reportTarget.id,
                reason: payload.reason,
                details: payload.details,
            });
            toast.success("Report submitted. Thank you for keeping Tribe safe.");
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast.error("Failed to submit report.");
        } finally {
            setReportTarget(null);
        }
    };

    return (
        <div className={`bg-background min-h-screen text-primary touch-pan-y ${isFullHeightPage ? 'h-screen overflow-hidden' : ''}`}>
            <Toaster />
            <Sidebar
                activeItem={activeNavItem}
                onSelectItem={handleNavigation}
                currentUser={currentUser}
                unreadMessageCount={unreadMessageCount}
                unreadTribeCount={unreadTribeCount}
                unreadNotificationCount={unreadNotificationCount}
                isChatOpen={isChatOpen}
            />

            <main
                className={`${shouldHideHeader ? 'pt-0 md:pt-16' : 'pt-16'} pb-16 md:pb-0 transition-all duration-300 ${isFullHeightPage ? 'h-screen' : 'min-h-screen'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    ref={mainRef}
                    className={`${containerClass} transition-transform transition-opacity duration-200 ease-out`}
                    style={{
                        transform: swipeDirection === 'left' ? 'translateX(-12px)' : swipeDirection === 'right' ? 'translateX(12px)' : 'translateX(0)',
                        opacity: swipeDirection ? 0.9 : 1,
                    }}
                >
                    <ErrorBoundary onReset={() => window.location.reload()}>
                        <Routes>
                            <Route path="/" element={
                                <>
                                    <CreatePost currentUser={currentUser} allUsers={visibleUsers} myStories={myStories} onAddPost={handleAddPost} isPosting={isCreatingPost} onOpenStoryCreator={() => setIsCreatingStory(true)} onViewUserStories={handleViewUserStories} />
                                    <StoryFeed myStories={myStories} followingUserStories={followingUserStories} currentUser={currentUser} seenStoryAuthors={new Set()} onViewUserStories={handleViewUserStories} />
                                    <FeedPage
                                        posts={visiblePosts.filter(p => (currentUser?.following || []).includes(p.author.id) || p.author.id === currentUser?.id)}
                                        currentUser={currentUser}
                                        allUsers={visibleUsers}
                                        allTribes={tribes}
                                        onLikePost={handleLikePost}
                                        onCommentPost={handleCommentPost}
                                        onDeletePost={handleDeletePost}
                                        onHidePost={handleHidePost}
                                        onDeleteComment={handleDeleteComment}
                                        onViewProfile={handleViewProfile}
                                        onSharePost={handleSharePost}
                                        onReportPost={(postId) => openReportModal('post', postId)}
                                        onVisitDiscover={() => navigate('/discover')}
                                        onLoadMore={handleLoadMoreFeed}
                                        hasMore={feedHasMore}
                                    />
                                </>
                            } />

                            <Route path="/discover" element={
                                <DiscoverPage
                                    posts={visiblePosts}
                                    users={visibleUsers}
                                    tribes={tribes}
                                    currentUser={currentUser}
                                    onLikePost={handleLikePost}
                                    onCommentPost={handleCommentPost}
                                    onDeletePost={handleDeletePost}
                                    onHidePost={handleHidePost}
                                    onDeleteComment={handleDeleteComment}
                                    onToggleFollow={(id) => handleToggleFollow(id)}
                                    onViewProfile={handleViewProfile}
                                    onViewTribe={handleViewTribe}
                                    onJoinToggle={handleJoinToggle}
                                    onEditTribe={setEditingTribe}
                                    onSharePost={handleSharePost}
                                    onReportPost={(postId) => openReportModal('post', postId)}
                                    onLoadMore={handleLoadMoreDiscover}
                                    hasMore={discoverHasMore}
                                />
                            } />

                            <Route path="/messages" element={
                                <ChatWrapper
                                    currentUser={currentUser}
                                    allUsers={visibleUsers}
                                    psyduck={PSYDUCK_USER}
                                    onViewProfile={handleViewProfile}
                                    onSharePost={handleSharePost}
                                    setIsChatOpen={setIsChatOpen}
                                />
                            } />

                            <Route path="/psyduck" element={
                                <ChatPage
                                    currentUser={currentUser}
                                    allUsers={visibleUsers}
                                    chukUser={PSYDUCK_USER}
                                    initialTargetUser={PSYDUCK_USER}
                                    onViewProfile={handleViewProfile}
                                    onSharePost={handleSharePost}
                                    onConversationStateChange={setIsChatOpen}
                                />
                            } />

                            <Route path="/tribes" element={
                                <TribesPage currentUser={currentUser!} unreadTribeCount={unreadCounts.tribes} />
                            } />

                            <Route path="/tribes/:tribeId" element={
                                <TribeDetailPage currentUser={currentUser} />
                            } />

                            <Route path="/notifications" element={
                                <NotificationsPage
                                    notifications={notifications}


                                    allTribes={tribes}
                                    currentUser={currentUser!}
                                    onViewProfile={handleViewProfile}
                                    onViewMessage={handleStartConversation}
                                    onViewPost={handleViewPost}
                                    onViewTribe={handleViewTribe}
                                    onViewStory={handleViewUserStories}
                                />
                            } />

                            <Route path="/profile/:userId" element={
                                <ProfileWrapper
                                    users={users} visibleUsers={visibleUsers} tribes={tribes} posts={visiblePosts}
                                    currentUser={currentUser} myStories={myStories} followingUserStories={followingUserStories}
                                    // pass actions...
                                    handlers={{
                                        onLikePost: handleLikePost,
                                        onCommentPost: handleCommentPost,
                                        onDeletePost: handleDeletePost,
                                        onHidePost: handleHidePost,
                                        onDeleteComment: handleDeleteComment,
                                        onViewProfile: handleViewProfile,
                                        onUpdateUser: handleUpdateUser,
                                        onAddPost: handleAddPost,
                                        onToggleFollow: handleToggleFollow,
                                        onToggleBlock: handleToggleBlock,
                                        onStartConversation: handleStartConversation,
                                        onNavigate: handleNavigation,
                                        onSharePost: handleSharePost,
                                        onOpenStoryCreator: () => setIsCreatingStory(true),
                                        onViewUserStories: handleViewUserStories,
                                        onReportPost: (postId: string) => openReportModal('post', postId),
                                        onReportUser: (userId: string) => openReportModal('user', userId)
                                    }}
                                    isPosting={isCreatingPost}
                                />
                            } />

                            <Route path="/settings" element={
                                <SettingsPage currentUser={currentUser} onBack={() => navigate(`/profile/${currentUser?.id}`)} />
                            } />
                            <Route path="/settings/account" element={
                                <AccountPage currentUser={currentUser} allUsers={users} onLogout={logout} onDeleteAccount={handleDeleteAccount} onToggleBlock={handleToggleBlock} />
                            } />
                            <Route path="/settings/help" element={<HelpPage />} />
                            <Route path="/settings/about" element={<AboutPage />} />
                            <Route path="/settings/rules" element={<RulesPoliciesPage />} />
                            <Route
                                path="/admin"
                                element={
                                    currentUser?.isAdmin ? (
                                        <AdminSettingsPage currentUser={currentUser} />
                                    ) : (
                                        <Navigate to="/settings" replace />
                                    )
                                }
                            />
                            <Route
                                path="/admin/posts"
                                element={
                                    currentUser?.isAdmin ? (
                                        <AdminPostsPage currentUser={currentUser} />
                                    ) : (
                                        <Navigate to="/settings" replace />
                                    )
                                }
                            />
                            <Route
                                path="/admin/users"
                                element={
                                    currentUser?.isAdmin ? (
                                        <AdminUsersPage />
                                    ) : (
                                        <Navigate to="/settings" replace />
                                    )
                                }
                            />
                            <Route
                                path="/admin/tribes"
                                element={
                                    currentUser?.isAdmin ? (
                                        <AdminTribesPage />
                                    ) : (
                                        <Navigate to="/settings" replace />
                                    )
                                }
                            />
                            <Route
                                path="/admin/super"
                                element={
                                    currentUser?.isSuperAdmin ? (
                                        <SuperAdminPage />
                                    ) : (
                                        <Navigate to="/admin" replace />
                                    )
                                }
                            />

                        </Routes>
                    </ErrorBoundary>
                </div>
            </main>

            {/* Modals */}
            {editingTribe && <EditTribeModal
                tribe={editingTribe}
                onClose={() => setEditingTribe(null)}
                onSuccess={(updatedTribe) => { /* handled in Context or we refresh */ fetchTribes(); setEditingTribe(null); toast.success("Tribe updated"); }}
                allUsers={users}
            />}
            {isCreatingStory && <StoryCreator onClose={() => setIsCreatingStory(false)} onCreate={handleCreateStory} />}
            {viewingUserStories && <StoryViewer userStories={viewingUserStories} currentUser={currentUser} allUsers={visibleUsers} allTribes={tribes} onClose={() => setViewingUserStories(null)} onDelete={handleDeleteStory} onLike={handleLikeStory} onSharePost={handleSharePost} initialStoryId={viewingUserStories.initialStoryId} />}
            {viewingPost && <PostViewModal post={viewingPost} currentUser={currentUser} allUsers={visibleUsers} allTribes={tribes} onLike={handleLikePost} onComment={handleCommentPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onViewProfile={handleViewProfile} onSharePost={handleSharePost} onReportPost={(postId) => openReportModal('post', postId)} onClose={() => setViewingPost(null)} />}
            {reportTarget && (
                <ReportModal
                    targetType={reportTarget.type}
                    onClose={() => setReportTarget(null)}
                    onSubmit={handleSubmitReport}
                />
            )}

        </div>
    );
}

// Wrapper for Profile to extract params and feed ProfilePage
const ProfileWrapper = ({ users, visibleUsers, tribes, posts, currentUser, myStories, followingUserStories, handlers, isPosting }: any) => {
    const { userId } = React.useMemo(() => {
        const params = new URLSearchParams(window.location.search); // Wait, params via useParams
        return { userId: window.location.pathname.split('/').pop() };
    }, [window.location.pathname]); // Simple hack or useParams

    // Better: use useParams
    // But I cannot use hook inside callback or here easily without importing.
    // I can stick to Route element usage if I define component outside.
    // Or just inline it.

    // Actually, let's use a real component.
    return <ProfilePageContent userId={userId} users={users} visibleUsers={visibleUsers} tribes={tribes} posts={posts} currentUser={currentUser} myStories={myStories} followingUserStories={followingUserStories} handlers={handlers} isPosting={isPosting} />
};

import { useParams } from 'react-router-dom';

const ProfilePageContent = ({ userId, users, visibleUsers, tribes, posts, currentUser, myStories, followingUserStories, handlers, isPosting }: any) => {
    const params = useParams();
    const targetId = params.userId || userId;
    const [fetchedUser, setFetchedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const viewedUser = users.find((u: User) => u.id === targetId) || (targetId === currentUser?.id ? currentUser : null) || fetchedUser;

    useEffect(() => {
        if (!viewedUser && targetId) {
            setIsLoading(true);
            api.fetchUser(targetId)
                .then(({ data }) => setFetchedUser(data))
                .catch(() => { }) // handled by UI showing not found
                .finally(() => setIsLoading(false));
        }
    }, [targetId, viewedUser]);

    if (isLoading) return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;

    if (!viewedUser) return <div className="text-center p-8">User not found</div>;

    const userPosts = posts.filter((p: Post) => p.author.id === viewedUser.id);
    const userHasStory = myStories.some((s: Story) => s.user === viewedUser.id) || followingUserStories.some((us: any) => us.user.id === viewedUser.id);

    return <ProfilePage
        user={viewedUser}
        allUsers={users}
        visibleUsers={visibleUsers}
        allTribes={tribes}
        posts={userPosts}
        currentUser={currentUser}
        hasStory={userHasStory}
        {...handlers}
        isPosting={isPosting}
        myStories={myStories}
    />;
};

// Wrapper for Chat to handle location state
const ChatWrapper = ({ currentUser, allUsers, psyduck, onViewProfile, onSharePost, setIsChatOpen }: any) => {
    const location = useLocation();
    const initialTargetUser = location.state?.targetUser || null;
    return <ChatPage currentUser={currentUser} allUsers={allUsers} chukUser={psyduck} initialTargetUser={initialTargetUser} onViewProfile={onViewProfile} onSharePost={onSharePost} onConversationStateChange={setIsChatOpen} />;
}


const App: React.FC = () => {
    const { currentUser, isLoading: isAuthLoading } = useAuth();

    // Version Check
    useEffect(() => {
        const APP_VERSION = 'v4';
        const currentVersion = localStorage.getItem('app_version');
        if (currentVersion !== APP_VERSION) {
            safeClear();
            safeSetItem('app_version', APP_VERSION);
            window.location.reload();
        }
        if (localStorage.getItem('currentUser') && !localStorage.getItem('token')) {
            localStorage.clear();
            window.location.href = '/login';
        }
    }, []);

    if (isAuthLoading) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center"><img src="/duckload.gif" alt="Loading..." className="w-24 h-24" /><h1 className="mt-4 text-xl font-semibold text-primary">Loading...</h1></div>;
    }

    if (!currentUser) return <LoginPage />;

    return (
        <GlobalContentProvider>
            <NotificationsConsumer>
                <MainLayout />
            </NotificationsConsumer>
        </GlobalContentProvider>
    );
};

// Helper to provide notifications from SocketContext to NotificationsPage
// Since NotificationsPage needs 'notifications' prop which was in App state.
// In MainLayout, I can access it via useSocket().
// I did passing in Route. 
// Route path="/notifications" element={<NotificationsPage notifications={notifications} ... />}
// In MainLayout: const { notifications } = useSocket(); (Need to destruct it)
// I destructed unreadCounts... I should add notifications to destructure.

const NotificationsConsumer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
} // useless wrapper for now but structure is fine.

export default App;
