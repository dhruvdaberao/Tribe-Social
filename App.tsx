



import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { User, Post, Tribe, TribeMessage, Notification as NotificationType, Comment, Story } from './types';
import * as api from './api'; // Assumed in root based on instruction

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
import StoryCreator from './components/stories/StoryCreator';
import StoryViewer from './components/stories/StoryViewer';
import StoryFeed from './components/stories/StoryFeed';
import { Toaster, toast } from './components/common/Toast';
import PostViewModal from './components/profile/PostViewModal';

export type NavItem = 'Home' | 'Discover' | 'Messages' | 'Tribes' | 'Notifications' | 'Profile' | 'Chuk' | 'TribeDetail' | 'Settings';

const CHUK_AI_USER: User = {
    id: 'chuk-ai',
    name: 'Chuk',
    username: 'chuk_the_chicken',
    avatarUrl: '/chuk.gif',
    bannerUrl: null,
    bio: 'Your personal guide & friend at Tribe! 🐣',
    followers: [],
    following: [],
    blockedUsers: [],
};

// Use LocalStorage Only for Preferences
import { safeSet, safeGet } from './utils/storage';

const App: React.FC = () => {
    const { currentUser, setCurrentUser, logout, isLoading: isAuthLoading } = useAuth();
    const { socket, notifications, setNotifications, unreadCounts, unreadMessageCount, unreadTribeCount, unreadNotificationCount, clearUnreadTribe } = useSocket();

    // Global State
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [tribes, setTribes] = useState<Tribe[]>([]);
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [followingUserStories, setFollowingUserStories] = useState<{ user: User, stories: Story[] }[]>([]);

    // Load seen stories from local storage
    const [seenStoryAuthors, setSeenStoryAuthors] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('tribe_storage_seen_stories');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (e) {
            return new Set();
        }
    });

    // Persist seen stories
    useEffect(() => {
        try {
            localStorage.setItem('tribe_storage_seen_stories', JSON.stringify(Array.from(seenStoryAuthors)));
        } catch (e) {
            console.error("Failed to save seen stories", e);
        }
    }, [seenStoryAuthors]);

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isAllPostsLoaded, setIsAllPostsLoaded] = useState(false);

    // Use refs for timestamps to avoid re-renders
    const lastFetchTimestamp = useRef<number>(0);
    const tribesRetryCount = useRef<number>(0);


    // Navigation & Modal State
    const [activeNavItem, setActiveNavItem] = useState<NavItem>('Home');
    const [prevNavItem, setPrevNavItem] = useState<NavItem>('Home');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [viewedUser, setViewedUser] = useState<User | null>(null);

    // URL Sync for Tribes
    const navigate = useNavigate();
    const location = useLocation();

    // Listen for custom "open-story" event from Chat
    useEffect(() => {
        const handleOpenStory = (e: any) => {
            const userId = e.detail;
            if (userId) {
                handleViewUserStories(userId);
            }
        };
        window.addEventListener('open-story', handleOpenStory);
        return () => window.removeEventListener('open-story', handleOpenStory);
    }, []);

    useEffect(() => {
        if (location.pathname === '/tribes' || location.pathname === '/tribes/') {
            setActiveNavItem('Tribes');
        } else if (location.pathname.startsWith('/tribes/')) {
            setActiveNavItem('TribeDetail');
        }
    }, [location.pathname]);

    // ... existing code ...
    const [viewedTribe, setViewedTribe] = useState<Tribe | null>(null);
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);
    const [chatTarget, setChatTarget] = useState<User | null>(null);
    const [isCreatingStory, setIsCreatingStory] = useState(false);
    const [viewingUserStories, setViewingUserStories] = useState<{ user: User, stories: Story[] } | null>(null);

    // Initialize from SessionStorage for instant load
    useEffect(() => {
        // PERMANENT FIX: Force clear storage if version mismatch to remove bad tokens
        const APP_VERSION = 'v4'; // Increment this to force logout everyone
        const currentVersion = localStorage.getItem('app_version');

        if (currentVersion !== APP_VERSION) {
            console.log("⚠️ Upgrading App Version: Clearing potentially corrupted storage...");
            localStorage.clear();
            localStorage.setItem('app_version', APP_VERSION);
            window.location.reload();
            return;
        }

        // ZOMBIE CHECK: If currentUser exists but token is missing, logout immediately
        if (localStorage.getItem('currentUser') && !localStorage.getItem('token')) {
            console.warn("🧟 Zombie Session Detected: User exists but Token missing. Logging out...");
            localStorage.clear();
            window.location.href = '/login';
            return;
        }

        // REMOVED CACHING LOGIC to prevent storage quota errors.
        // Data is now fetched fresh on every load.
    }, []);

    const userMap = useMemo(() => {
        const map = new Map(users.map((user: User) => [user.id, user]));
        map.set(CHUK_AI_USER.id, CHUK_AI_USER);
        return map;
    }, [users]);

    const populatePost = useCallback((postFromApi: any, userMapToUse: Map<string, User>): Post | null => {
        const { user: author, ...restOfPost } = postFromApi;
        // If author is null (deleted user), skip
        if (!author) return null;

        return {
            ...restOfPost,
            author, // Assuming author is already populated object from backend
            comments: restOfPost.comments ? restOfPost.comments.map((comment: any) => {
                const { user, ...restOfComment } = comment;
                return { ...restOfComment, author: user };
            }).filter((c: any) => c.author) : [],
        };
    }, []);

    const fetchData = useCallback(async () => {
        // Allow fetch if enough time passed OR if we have no posts yet (first load situation)
        if (isFetching || (Date.now() - lastFetchTimestamp.current < 10000)) return;

        if (!currentUser) {
            setIsDataLoaded(false);
            return;
        }

        setIsFetching(true);
        lastFetchTimestamp.current = Date.now();

        try {
            // Decoupled fetching strategy: fire all requests, update state AS SOON as each finishes.
            // This prevents a slow request (e.g. Feed) from blocking a fast request (e.g. Tribes).

            const usersPromise = api.fetchUsers()
                .then(({ data }) => {
                    setUsers(data);
                    setUsers(data);
                    // saveToCache('users', data); // Removed
                })
                .catch(e => console.error("Failed to fetch users", e));

            const postsPromise = api.fetchFeedPosts()
                .then(async ({ data }) => {
                    // Populate posts with empty user map initially, real users will fill in via state update or re-render
                    // actually, wait, we might need users... ensure we have a fallback or minimal population
                    // For now, simple population. 'users' state update triggers re-render anyway.
                    const populatedPosts = data.map((post: any) => populatePost(post, new Map())).filter(Boolean);
                    setPosts(populatedPosts as Post[]);
                    setPosts(populatedPosts as Post[]);
                    // saveToCache('posts', populatedPosts.slice(0, 50)); // Removed
                })
                .catch(e => console.error("Failed to fetch posts", e));

            const tribesPromise = api.fetchTribes()
                .then(({ data }) => {
                    if (data.length === 0 && tribesRetryCount.current === 0) {
                        console.warn("⚠️ Tribes list empty. Retrying fetch once...");
                        tribesRetryCount.current = 1;
                        setTimeout(() => {
                            api.fetchTribes().then(({ data: retryData }) => {
                                const populated = retryData.map((tribe: any) => ({ ...tribe, messages: [] }));
                                setTribes(populated);
                                setTribes(populated);
                                // saveToCache('tribes', populated); // Removed
                                if (retryData.length > 0) console.log("✅ Retry successful: Tribes loaded.");
                            }).catch(e => console.error("❌ Tribe retry failed", e));
                        }, 1500);
                        // Return empty for now so we resolve
                        return [];
                    } else {
                        const populatedTribes = data.map((tribe: any) => ({ ...tribe, messages: [] }));
                        setTribes(populatedTribes);
                        setTribes(populatedTribes);
                        // saveToCache('tribes', populatedTribes); // Removed
                        return populatedTribes;
                    }
                })
                .catch(e => console.error("Failed to fetch tribes", e));

            const notificationsPromise = api.fetchNotifications()
                .then(({ data }) => {
                    setNotifications(data);
                    setNotifications(data);
                    // saveToCache('notifications', data); // Removed
                })
                .catch(e => console.error("Failed to fetch notifications", e));

            const myStoriesPromise = api.fetchMyStories()
                .then(({ data }) => {
                    setMyStories(data);
                    setMyStories(data);
                    // saveToCache('myStories', data); // Removed
                })
                .catch(e => console.error("Failed to fetch my stories", e));

            const followingStoriesPromise = api.fetchFollowingStories()
                .then(({ data }) => {
                    setFollowingUserStories(data);
                    setFollowingUserStories(data);
                    // saveToCache('followingStories', data); // Removed
                })
                .catch(e => console.error("Failed to fetch stories", e));

            // Wait for all to finish only to set "isFetching" to false and "Data Loaded" to true.
            // But the UI will already be populated by the individual .then blocks above!
            await Promise.allSettled([
                usersPromise,
                postsPromise,
                tribesPromise,
                notificationsPromise,
                myStoriesPromise,
                followingStoriesPromise
            ]);

            setIsDataLoaded(true);

        } catch (error) {
            console.error("Background data fetch error:", error);
        } finally {
            setIsFetching(false);
        }
    }, [currentUser, populatePost, setNotifications]);

    const fetchAllPostsForDiscover = useCallback(async () => {
        if (isAllPostsLoaded) return;
        try {
            const { data } = await api.fetchPosts();
            const populated = data.map((post: any) => populatePost(post, userMap)).filter(Boolean);

            setPosts(prev => {
                const postMap = new Map(prev.map(p => [p.id, p]));
                (populated as Post[]).forEach(p => postMap.set(p.id, p));
                return Array.from(postMap.values()).sort((a: Post, b: Post) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });

            setIsAllPostsLoaded(true);
        } catch (error) {
            console.error("Failed to fetch all posts for discover", error);
        }
    }, [isAllPostsLoaded, userMap, populatePost]);

    useEffect(() => {
        if (!isAuthLoading && currentUser) {
            fetchData();
        }
    }, [fetchData, isAuthLoading, currentUser]);

    // Socket Setup
    useEffect(() => {
        if (socket && tribes.length > 0 && currentUser) {
            const myTribeIds = tribes.filter(t => t.members.includes(currentUser.id)).map(t => t.id);
            myTribeIds.forEach(tribeId => {
                socket.emit('joinRoom', `tribe-${tribeId}`);
            });
        }
    }, [socket, tribes, currentUser]);

    useEffect(() => {
        if (!socket || !viewedTribe || !viewedTribe.id) return;
        const room = `tribe-${viewedTribe.id}`;
        socket.emit('joinRoom', room);
        return () => { socket.emit('leaveRoom', room); };
    }, [socket, viewedTribe?.id]);

    useEffect(() => {
        if (!socket || !userMap.size) return;
        const handleNewPost = (post: any) => {
            const populated = populatePost(post, userMap);
            if (populated) {
                setPosts(prev => {
                    const optimisticPostIndex = prev.findIndex(p => p.id === `temp-${post.tempId}`);
                    if (optimisticPostIndex > -1) {
                        const newPosts = [...prev];
                        newPosts[optimisticPostIndex] = populated;
                        return newPosts;
                    }
                    if (prev.some(p => p.id === populated.id)) return prev;
                    return [populated, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                });
            }
        };
        const handlePostUpdated = (updatedPost: any) => {
            const populated = populatePost(updatedPost, userMap);
            if (populated) setPosts(prev => prev.map(p => p.id === populated.id ? populated : p));
        };
        const handlePostDeleted = (postId: string) => setPosts(prev => prev.filter(p => p.id !== postId));

        // Tribe message handling in App.tsx mainly for global unread counts or if open. 
        // Specific detail page handles its own history fetch.
        const handleNewTribeMessage = (message: TribeMessage) => {
            if (viewedTribe && viewedTribe.id === message.tribeId) {
                // Ensure sender object is used if available, or fallback to userMap
                const sender = message.sender || userMap.get(message.senderId!);

                if (sender) {
                    setViewedTribe(prev => {
                        if (!prev) return null;
                        if (prev.messages.some(m => m.id === message.id)) return prev;
                        return { ...prev, messages: [...prev.messages, { ...message, sender }] };
                    });
                }
            }
        };
        const handleTribeMessageDeleted = ({ tribeId, messageId }: { tribeId: string, messageId: string }) => {
            if (viewedTribe && viewedTribe.id === tribeId) setViewedTribe(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== messageId) } : null);
        };
        const handleUserUpdated = (updatedUser: User) => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
            if (viewedUser?.id === updatedUser.id) setViewedUser(updatedUser);
        };
        const handleTribeDeleted = (tribeId: string) => {
            setTribes(prev => prev.filter(t => t.id !== tribeId));
            if (viewedTribe?.id === tribeId) {
                setViewedTribe(null);
                setActiveNavItem('Tribes');
                toast.info('This tribe has been deleted by the owner.');
            }
        };

        socket.on('newPost', handleNewPost);
        socket.on('postUpdated', handlePostUpdated);
        socket.on('postDeleted', handlePostDeleted);
        socket.on('newTribeMessage', handleNewTribeMessage);
        socket.on('tribeMessageDeleted', handleTribeMessageDeleted);
        socket.on('userUpdated', handleUserUpdated);
        socket.on('tribeDeleted', handleTribeDeleted);

        return () => {
            socket.off('newPost', handleNewPost);
            socket.off('postUpdated', handlePostUpdated);
            socket.off('postDeleted', handlePostDeleted);
            socket.off('newTribeMessage', handleNewTribeMessage);
            socket.off('tribeMessageDeleted', handleTribeMessageDeleted);
            socket.off('userUpdated', handleUserUpdated);
            socket.off('tribeDeleted', handleTribeDeleted);
        };
    }, [socket, userMap, populatePost, currentUser?.id, setCurrentUser, viewedUser?.id, viewedTribe, isCreatingPost]);

    const handleSelectItem = (item: NavItem) => {
        // If clicking the already active item, scroll to top
        if (item === activeNavItem && item !== 'Profile' && item !== 'TribeDetail') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Start transition
        setIsTransitioning(true);
        setPrevNavItem(activeNavItem);

        setChatTarget(null);
        if (item === 'Profile') {
            // Logic for profile can be complex (own profile vs others), but if we click "Profile" in nav, usually means own profile.
            // If we are already on own profile, scroll to top.
            if (activeNavItem === 'Profile' && viewedUser?.id === currentUser?.id) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsTransitioning(false);
                return;
            }
            setViewedUser(currentUser);
        } else if (item !== 'Settings') {
            setViewedUser(null);
        }
        if (item !== 'TribeDetail') setViewedTribe(null);
        if (item === 'Chuk') {
            handleStartConversation(CHUK_AI_USER);
            setIsTransitioning(false);
            return;
        }
        setActiveNavItem(item);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Also scroll to top on new navigation

        // End transition after a brief delay
        setTimeout(() => {
            setIsTransitioning(false);
        }, 100);
    };

    const handleViewProfile = (user: User) => {
        setViewedUser(user);
        setActiveNavItem('Profile');
    };

    const handleStartConversation = (targetUser: User) => {
        setChatTarget(targetUser);
        setActiveNavItem('Messages');
    };

    const handleAddPost = async (content: string, imageUrl?: string) => {
        if (!currentUser) return;
        setIsCreatingPost(true);
        const tempId = Date.now().toString();
        // Optimistic update
        const tempPost: Post = {
            id: `temp-${tempId}`,
            author: currentUser,
            content: content,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: [],
        };
        setPosts(prev => [tempPost, ...prev]);

        try {
            await api.createPost({ content, imageUrl, tempId });
            toast.success("Post created successfully!");
        } catch (error) {
            console.error("Failed to add post:", error);
            toast.error("Could not create post. Please try again.");
            setPosts(prev => prev.filter(p => p.id !== `temp-${tempId}`));
        } finally {
            setIsCreatingPost(false);
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!currentUser) return;
        const originalPosts = [...posts];
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const isLiked = p.likes.includes(currentUser.id);
                return { ...p, likes: isLiked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] };
            }
            return p;
        }));
        try {
            await api.likePost(postId);
        } catch (error) {
            console.error("Failed to like post:", error);
            toast.error("Like failed. Reverting.");
            setPosts(originalPosts);
        }
    };

    const handleCommentPost = async (postId: string, text: string) => {
        if (!currentUser) return;
        const tempCommentId = `temp-${Date.now()}`;
        const tempComment: Comment = { id: tempCommentId, author: currentUser, text, timestamp: new Date().toISOString() };
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, tempComment] } : p));
        try {
            await api.commentOnPost(postId, { text });
        } catch (error) {
            console.error("Failed to comment:", error);
            toast.error("Failed to post comment.");
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== tempCommentId) } : p));
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser) return;
        // Optimistic delete
        const originalPosts = posts;
        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            await api.deletePost(postId);
            toast.success("Post deleted.");
        } catch (error) {
            console.error("Failed to delete post:", error);
            toast.error("Could not delete post.");
            setPosts(originalPosts);
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!currentUser) return;
        const originalPosts = posts;
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p));
        try {
            await api.deleteComment(postId, commentId);
        } catch (error) {
            console.error("Failed to delete comment:", error);
            toast.error("Could not delete comment.");
            setPosts(originalPosts);
        }
    };

    const handleSharePost = async (post: any, destination: { type: 'tribe' | 'user', id: string, name?: string }) => {
        if (!currentUser) return;

        // 🔥 Fix: Don't add "Shared Post" prefix if it's a Shared Story (already has its own prefix)
        const messageText = post.content.startsWith('[Shared Story]')
            ? post.content
            : `[Shared Post by @${post.author.username}]:\n${post.content}`;

        const messageData = {
            text: messageText,
            imageUrl: post.imageUrl,
            sender: currentUser,
            timestamp: new Date().toISOString(),
        };
        try {
            if (destination.type === 'tribe') {
                await api.sendTribeMessage(destination.id, { text: messageData.text, imageUrl: messageData.imageUrl });
                toast.success(`Post successfully shared to tribe!`);
            } else {
                await api.sendMessage(destination.id, { message: messageData.text, imageUrl: messageData.imageUrl });
                toast.success(`Post successfully shared with user!`);
            }
        } catch (error) {
            console.error("Failed to share post:", error);
            toast.error("Could not share post. Please try again.");
        }
    };

    const handleViewPost = async (postId: string) => {
        let post = posts.find(p => p.id === postId);
        if (!post) {
            try {
                toast.info("Loading post...");
                const { data } = await api.fetchPost(postId);
                const populatedPost = populatePost(data, userMap);
                if (populatedPost) {
                    setPosts(prev => {
                        const postExists = prev.some(p => p.id === populatedPost.id);
                        return postExists ? prev : [populatedPost, ...prev];
                    });
                    post = populatedPost;
                }
            } catch (error) {
                console.error("Failed to fetch single post:", error);
                toast.error("Could not load the post. It may have been deleted.");
                return;
            }
        }
        if (post) {
            setViewingPost(post);
        } else {
            toast.error("Could not find the post. It may have been deleted.");
        }
    };

    const handleUpdateUser = async (updatedUserData: Partial<User>) => {
        if (!currentUser) return;
        try {
            await api.updateProfile(updatedUserData);
            toast.success("Profile updated!");
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    const handleToggleFollow = async (targetUserId: string) => {
        if (!currentUser || currentUser.id === targetUserId) return;
        const originalCurrentUser = { ...currentUser };
        const originalViewedUser = viewedUser ? { ...viewedUser } : null;
        const isFollowing = currentUser.following.includes(targetUserId);

        setCurrentUser(prev => prev ? { ...prev, following: isFollowing ? prev.following.filter(id => id !== targetUserId) : [...prev.following, targetUserId] } : null);

        if (viewedUser) {
            setViewedUser(prev => {
                if (!prev) return null;
                if (prev.id === targetUserId) {
                    const newFollowers = isFollowing ? prev.followers.filter(id => id !== currentUser.id) : [...prev.followers, currentUser.id];
                    return { ...prev, followers: newFollowers };
                }
                if (prev.id === currentUser.id) {
                    return { ...prev, following: isFollowing ? prev.following.filter(id => id !== targetUserId) : [...prev.following, targetUserId] };
                }
                return prev;
            });
        }
        try {
            await api.toggleFollow(targetUserId);
        } catch (error) {
            console.error('Failed to toggle follow', error);
            toast.error("Action failed. Reverting.");
            setCurrentUser(originalCurrentUser);
            if (originalViewedUser) setViewedUser(originalViewedUser);
        }
    };

    const handleToggleBlock = async (targetUserId: string) => {
        if (!currentUser) return;
        const originalUser = { ...currentUser };
        const isBlocked = (currentUser.blockedUsers || []).includes(targetUserId);
        setCurrentUser(prev => prev ? { ...prev, blockedUsers: isBlocked ? (prev.blockedUsers || []).filter(id => id !== targetUserId) : [...(prev.blockedUsers || []), targetUserId] } : null);
        try {
            await api.toggleBlock(targetUserId);
            toast.success(isBlocked ? "User unblocked." : "User blocked.");
        } catch (error) {
            console.error('Failed to toggle block', error);
            toast.error("Action failed. Reverting.");
            setCurrentUser(originalUser);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure? This action is irreversible.")) {
            try {
                await api.deleteAccount();
                toast.success("Account deleted successfully.");
                logout();
            } catch (error) {
                console.error("Failed to delete account:", error);
                toast.error("Could not delete account. Please try again.");
            }
        }
    };

    const handleJoinToggle = async (tribeId: string) => {
        if (!currentUser) return;
        try {
            const { data: updatedTribe } = await api.joinTribe(tribeId);
            setTribes(tribes.map(t => t.id === tribeId ? { ...t, members: updatedTribe.members } : t));
            if (viewedTribe?.id === tribeId) {
                setViewedTribe(prev => prev ? { ...prev, members: updatedTribe.members } : null);
            }
        } catch (error) {
            console.error("Failed to join/leave tribe:", error);
        }
    };

    const handleCreateTribe = async (name: string, description: string, avatarUrl?: string) => {
        try {
            const { data: newTribe } = await api.createTribe({ name, description, avatarUrl });
            setTribes(prev => [{ ...newTribe, messages: [] }, ...prev]);
            toast.success(`Tribe "${name}" created!`);
        } catch (error) {
            console.error("Failed to create tribe:", error);
        }
    };

    const handleViewTribe = async (tribe: Tribe) => {
        try {
            clearUnreadTribe(tribe.id);
            // Don't rely on global state for messages, just set the tribe object
            // The TribeDetailPage component will fetch its own messages on mount
            setViewedTribe({ ...tribe, messages: [] });
            navigate(`/tribes/${tribe.id}`);
        } catch (error) {
            console.error("Failed to set tribe view:", error);
        }
    };

    const handleEditTribe = async (tribeId: string, name: string, description: string, avatarUrl?: string | null) => {
        try {
            const { data: updatedTribeData } = await api.updateTribe(tribeId, { name, description, avatarUrl });
            setTribes(tribes.map(t => (t.id === tribeId ? { ...t, ...updatedTribeData } : t)));
            if (viewedTribe && viewedTribe.id === tribeId) {
                setViewedTribe(prev => prev ? { ...prev, ...updatedTribeData } : null);
            }
            setEditingTribe(null);
            toast.success("Tribe details updated.");
        } catch (error) {
            console.error("Failed to edit tribe:", error);
        }
    };

    const handleSendTribeMessage = async (tribeId: string, text: string, imageUrl?: string) => {
        if (!currentUser || !viewedTribe) return;
        try {
            await api.sendTribeMessage(tribeId, { text, imageUrl });
        } catch (error) {
            console.error("Failed to send tribe message:", error);
        }
    };

    const handleDeleteTribeMessage = async (tribeId: string, messageId: string) => {
        const originalMessages = viewedTribe?.messages || [];
        if (viewedTribe) setViewedTribe(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== messageId) } : null);
        try {
            await api.deleteTribeMessage(tribeId, messageId);
        } catch (error) {
            console.error("Failed to delete tribe message", error);
            toast.error("Could not delete message.");
            if (viewedTribe) setViewedTribe(prev => prev ? { ...prev, messages: originalMessages } : null);
        }
    }

    const handleDeleteTribe = async (tribeId: string) => {
        try {
            await api.deleteTribe(tribeId);
            setEditingTribe(null);
        } catch (error) {
            console.error("Failed to delete tribe", error);
            toast.error("Could not delete tribe.");
        }
    }

    const handleCreateStory = async (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => {
        try {
            const { data: newStory } = await api.createStory(storyData);
            setMyStories(prev => [newStory, ...prev]);
            setIsCreatingStory(false);
            handleViewUserStories(currentUser!.id, [newStory, ...myStories]);
            toast.success("Story posted!");
        } catch (error) {
            console.error("Failed to create story:", error);
            toast.error("Could not post story. Please try again.");
        }
    };

    const handleDeleteStory = async (storyId: string) => {
        const originalStories = myStories;
        setMyStories(prev => prev.filter(s => s.id !== storyId));
        setViewingUserStories(null);
        try {
            await api.deleteStory(storyId);
            toast.success("Story deleted.");
        } catch (error) {
            console.error("Failed to delete story:", error);
            toast.error("Could not delete story.");
            setMyStories(originalStories);
        }
    };

    const handleLikeStory = async (storyId: string) => {
        if (!currentUser) return;

        const optimisticUpdate = (storiesState: typeof followingUserStories) =>
            storiesState.map(userStoryGroup => ({
                ...userStoryGroup,
                stories: userStoryGroup.stories.map(story => {
                    if (story.id === storyId) {
                        const isLiked = story.likes.includes(currentUser.id);
                        return {
                            ...story,
                            likes: isLiked ? story.likes.filter(id => id !== currentUser.id) : [...story.likes, currentUser.id]
                        };
                    }
                    return story;
                })
            }));

        const originalFollowingStories = followingUserStories;
        setFollowingUserStories(optimisticUpdate(followingUserStories));
        if (viewingUserStories) {
            setViewingUserStories(prev => prev ? { ...prev, stories: optimisticUpdate([{ ...prev }])[0].stories } : null);
        }

        try {
            await api.likeStory(storyId);
        } catch (error) {
            console.error("Failed to like story:", error);
            toast.error("Like failed. Reverting.");
            setFollowingUserStories(originalFollowingStories);
        }
    };

    const handleViewUserStories = (userId: string, stories?: Story[]) => {
        let userStoryData;
        if (userId === currentUser?.id) {
            userStoryData = { user: currentUser, stories: stories || myStories };
        } else {
            const foundUserStories = followingUserStories.find(us => us.user.id === userId);
            if (foundUserStories) userStoryData = foundUserStories;
        }

        if (userStoryData && userStoryData.stories.length > 0) {
            setViewingUserStories(userStoryData);
            setSeenStoryAuthors(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                localStorage.setItem('seenStoryAuthors', JSON.stringify(Array.from(newSet)));
                return newSet;
            });
        }
    };


    const visiblePosts = useMemo(() => {
        if (!currentUser) return [];
        return posts.filter(p => !(currentUser.blockedUsers || []).includes(p.author.id) && !(p.author.blockedUsers || []).includes(currentUser.id));
    }, [posts, currentUser]);

    const visibleUsers = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(u => !(currentUser.blockedUsers || []).includes(u.id) && !(u.blockedUsers || []).includes(currentUser.id));
    }, [users, currentUser]);

    if (isAuthLoading) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center"><img src="/duckload.gif" alt="Loading..." className="w-24 h-24" /><h1 className="mt-4 text-xl font-semibold text-primary">Loading...</h1></div>;
    }

    if (!currentUser) return <LoginPage />;

    if (!isDataLoaded && isFetching && posts.length === 0) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center"><img src="/duckload.gif" alt="Loading..." className="w-24 h-24" /><h1 className="mt-4 text-xl font-semibold text-primary">Waking up the server...</h1></div>;
    }

    const isFullHeightPage = ['Messages', 'TribeDetail', 'Settings'].includes(activeNavItem);
    const isWidePage = ['Discover', 'Tribes', 'Profile'].includes(activeNavItem);

    const renderContent = () => {
        switch (activeNavItem) {
            case 'Home':
                const feedPosts = visiblePosts.filter(p => (currentUser.following || []).includes(p.author.id) || p.author.id === currentUser.id);
                return (
                    <>
                        <CreatePost currentUser={currentUser} allUsers={visibleUsers} myStories={myStories} onAddPost={handleAddPost} isPosting={isCreatingPost} onOpenStoryCreator={() => setIsCreatingStory(true)} onViewUserStories={handleViewUserStories} />
                        <StoryFeed myStories={myStories} followingUserStories={followingUserStories} currentUser={currentUser} seenStoryAuthors={seenStoryAuthors} onViewUserStories={handleViewUserStories} />
                        <FeedPage posts={feedPosts} currentUser={currentUser} allUsers={visibleUsers} allTribes={tribes} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onViewProfile={handleViewProfile} onSharePost={handleSharePost} />
                    </>
                );
            case 'Discover':
                return <DiscoverPage posts={visiblePosts} users={visibleUsers} tribes={tribes} currentUser={currentUser} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onToggleFollow={handleToggleFollow} onViewProfile={handleViewProfile} onViewTribe={handleViewTribe} onJoinToggle={handleJoinToggle} onEditTribe={(tribe) => setEditingTribe(tribe)} onSharePost={handleSharePost} onLoadMore={fetchAllPostsForDiscover} />;
            case 'Messages':
                return <ChatPage currentUser={currentUser} allUsers={visibleUsers} chukUser={CHUK_AI_USER} initialTargetUser={chatTarget} onViewProfile={handleViewProfile} onSharePost={handleSharePost} />;
            case 'Tribes':
                return (
                    <TribesPage
                        currentUser={currentUser!}
                        unreadTribeCount={unreadCounts.tribes}
                    />
                );
            case 'TribeDetail':
                // 🔥 FIX: Robust ID extraction
                const pathParts = location.pathname.split('/');
                const urlTribeId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]; // Handle trailing slash
                // Ensure it's not "tribes" or empty
                const effectiveTribeId = (urlTribeId && urlTribeId !== 'tribes') ? urlTribeId : viewedTribe?.id;

                if (!effectiveTribeId) return <div className="text-center p-8">Tribe not found.</div>;

                return <TribeDetailPage
                    currentUser={currentUser}
                    tribeId={effectiveTribeId}
                />;
            case 'Notifications':
                return (
                    <NotificationsPage
                        notifications={notifications}
                        allTribes={tribes}
                        currentUser={currentUser!}
                        onViewProfile={handleViewProfile} onViewMessage={handleStartConversation} onViewPost={handleViewPost} onViewTribe={handleViewTribe} onViewStory={handleViewUserStories} />
                );
            case 'Profile':
                if (!viewedUser || (currentUser.blockedUsers || []).includes(viewedUser.id) || (viewedUser.blockedUsers || []).includes(currentUser.id)) {
                    return <div className="text-center p-8">User not found or is blocked.</div>;
                }
                const userPosts = visiblePosts.filter(p => p.author.id === viewedUser.id);
                const userHasStory = myStories.some(s => s.user === viewedUser.id) || followingUserStories.some(us => us.user.id === viewedUser.id);
                return <ProfilePage user={viewedUser} allUsers={users} visibleUsers={visibleUsers} allTribes={tribes} posts={userPosts} currentUser={currentUser} hasStory={userHasStory} onLikePost={handleLikePost} onCommentPost={handleCommentPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onViewProfile={handleViewProfile} onUpdateUser={handleUpdateUser} onAddPost={handleAddPost} isPosting={isCreatingPost} onToggleFollow={handleToggleFollow} onStartConversation={handleStartConversation} onNavigate={handleSelectItem} onSharePost={handleSharePost} onOpenStoryCreator={() => setIsCreatingStory(true)} myStories={myStories} onViewUserStories={handleViewUserStories} />;
            case 'Settings':
                return <SettingsPage currentUser={currentUser} allUsers={users} onLogout={logout} onDeleteAccount={handleDeleteAccount} onToggleBlock={handleToggleBlock} onBack={() => handleSelectItem('Profile')} />;
            default:
                return <div>Page not found</div>;
        }
    };

    let containerClass = 'max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8';
    if (isFullHeightPage) {
        containerClass = 'h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]';
    } else if (isWidePage) {
        containerClass = 'max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8';
    }

    return (
        <div className="bg-background min-h-screen text-primary overflow-hidden">
            <Toaster />
            <Sidebar activeItem={activeNavItem} onSelectItem={handleSelectItem} currentUser={currentUser} unreadMessageCount={unreadMessageCount} unreadTribeCount={unreadTribeCount} unreadNotificationCount={unreadNotificationCount} />
            <main className="pt-16 pb-16 md:pb-0">
                <div className={containerClass}>
                    {renderContent()}
                </div>
            </main>
            {editingTribe && <EditTribeModal
                tribe={editingTribe}
                onClose={() => setEditingTribe(null)}
                onSuccess={(updatedTribe) => {
                    setTribes(prev => prev.map(t => t.id === updatedTribe.id ? { ...updatedTribe, messages: t.messages } : t));
                    setEditingTribe(null);
                    toast.success("Tribe updated successfully");
                }}
            />}
            {isCreatingStory && <StoryCreator onClose={() => setIsCreatingStory(false)} onCreate={handleCreateStory} />}
            {viewingUserStories && <StoryViewer userStories={viewingUserStories} currentUser={currentUser} allUsers={visibleUsers} allTribes={tribes} onClose={() => setViewingUserStories(null)} onDelete={handleDeleteStory} onLike={handleLikeStory} onSharePost={handleSharePost} />}
            {viewingPost && <PostViewModal post={viewingPost} currentUser={currentUser} allUsers={visibleUsers} allTribes={tribes} onLike={handleLikePost} onComment={handleCommentPost} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onViewProfile={handleViewProfile} onSharePost={handleSharePost} onClose={() => setViewingPost(null)} />}
        </div>
    );
};

export default App;
