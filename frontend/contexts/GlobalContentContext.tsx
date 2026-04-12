import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Post, Tribe, Story, Comment, TribeMessage } from '../types';
import * as api from '../api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { toast } from '../components/common/Toast';

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

interface GlobalContentContextType {
    // Data State
    users: User[];
    posts: Post[];
    tribes: Tribe[];
    myStories: Story[];
    followingUserStories: { user: User, stories: Story[] }[];
    isDataLoaded: boolean;
    isFetching: boolean;
    isCreatingPost: boolean;

    // Pagination State
    feedPage: number;
    feedHasMore: boolean;
    discoverPage: number;
    discoverHasMore: boolean;
    isLoadingMore: boolean;

    // Derived State
    userMap: Map<string, User>;
    visiblePosts: Post[];
    visibleUsers: User[];

    // Modal/View State (Global)
    viewingPost: Post | null;
    setViewingPost: (post: Post | null) => void;
    viewingUserStories: { user: User, stories: Story[], initialStoryId?: string } | null;
    setViewingUserStories: (data: { user: User, stories: Story[], initialStoryId?: string } | null) => void;
    isCreatingStory: boolean;
    setIsCreatingStory: (open: boolean) => void;
    editingTribe: Tribe | null;
    setEditingTribe: (tribe: Tribe | null) => void;

    // Actions
    // Actions
    fetchGlobalEssential: () => Promise<void>;
    fetchFeed: () => Promise<void>;
    fetchTribes: () => Promise<void>;
    handleLoadMoreFeed: () => Promise<void>;
    handleLoadMoreDiscover: () => Promise<void>;

    // CRUD Actions
    handleAddPost: (content: string, imageUrl?: string, mediaType?: 'image' | 'video', duration?: number) => Promise<void>;
    handleLikePost: (postId: string) => Promise<void>;
    handleCommentPost: (postId: string, text: string) => Promise<void>;
    handleDeletePost: (postId: string) => Promise<void>;
    handleHidePost: (postId: string) => Promise<void>;
    handleDeleteComment: (postId: string, commentId: string) => Promise<void>;
    handleSharePost: (post: any, destination: { type: 'tribe' | 'user', id: string, name?: string }) => Promise<void>;

    handleToggleFollow: (targetUserId: string, viewedUser?: User | null, setViewedUser?: React.Dispatch<React.SetStateAction<User | null>>) => Promise<void>;
    handleToggleBlock: (targetUserId: string) => Promise<boolean>;
    handleUpdateUser: (data: Partial<User>) => Promise<void>;
    handleDeleteAccount: () => Promise<void>;

    handleJoinToggle: (tribeId: string, viewedTribe?: Tribe | null, setViewedTribe?: React.Dispatch<React.SetStateAction<Tribe | null>>) => Promise<void>;
    handleCreateTribe: (name: string, description: string, avatarUrl?: string) => Promise<void>;
    handleEditTribe: (tribeId: string, name: string, description: string, avatarUrl?: string | null, viewedTribe?: Tribe | null, setViewedTribe?: React.Dispatch<React.SetStateAction<Tribe | null>>) => Promise<void>;
    handleDeleteTribe: (tribeId: string) => Promise<void>;

    handleCreateStory: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => Promise<void>;
    handleDeleteStory: (storyId: string) => Promise<void>;
    handleLikeStory: (storyId: string) => Promise<void>;

    handleViewPost: (postId: string) => Promise<void>;
    handleViewUserStories: (userId: string, stories?: Story[], initialStoryId?: string) => Promise<void>;
}

const GlobalContentContext = createContext<GlobalContentContextType | undefined>(undefined);

export const useGlobalContent = () => {
    const context = useContext(GlobalContentContext);
    if (!context) {
        throw new Error('useGlobalContent must be used within a GlobalContentProvider');
    }
    return context;
};

export const GlobalContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, setCurrentUser, logout, isLoading: isAuthLoading } = useAuth();
    const { socket, setNotifications, clearUnreadTribe } = useSocket();

    // --- Global State ---
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);

    // 🔥 Cache Tribes for Instant Load
    const [tribes, setTribes] = useState<Tribe[]>(() => {
        try {
            const cached = localStorage.getItem('tribe_storage_tribes');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });

    useEffect(() => {
        if (tribes.length > 0) {
            localStorage.setItem('tribe_storage_tribes', JSON.stringify(tribes));
        }
    }, [tribes]);
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [followingUserStories, setFollowingUserStories] = useState<{ user: User, stories: Story[] }[]>([]);

    // --- Pagination ---
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [discoverPage, setDiscoverPage] = useState(1);
    const [discoverHasMore, setDiscoverHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // --- Loading State ---
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    // --- Modals ---
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [viewingUserStories, setViewingUserStories] = useState<{ user: User, stories: Story[], initialStoryId?: string } | null>(null);
    const [isCreatingStory, setIsCreatingStory] = useState(false);
    const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);

    // --- Refs ---
    const lastFetchTimestamp = useRef<number>(0);
    const tribesRetryCount = useRef<number>(0);
    const DEBOUNCE_DELAY_MS = 10000;

    // --- Seen Stories Persistence ---
    const [seenStoryAuthors, setSeenStoryAuthors] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('tribe_storage_seen_stories');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (e) {
            return new Set();
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('tribe_storage_seen_stories', JSON.stringify(Array.from(seenStoryAuthors)));
        } catch (e) {
            console.error("Failed to save seen stories", e);
        }
    }, [seenStoryAuthors]);

    // --- Helpers ---
    const userMap = useMemo(() => {
        const map = new Map(users.map((user: User) => [user.id, user]));
        map.set(PSYDUCK_USER.id, PSYDUCK_USER);
        return map;
    }, [users]);

    const visiblePosts = useMemo(() => {
        if (!currentUser) return [];
        return posts.filter(p => !(currentUser.blockedUsers || []).includes(p.author.id) && !(p.author.blockedUsers || []).includes(currentUser.id));
    }, [posts, currentUser]);

    const visibleUsers = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(u => !(currentUser.blockedUsers || []).includes(u.id) && !(u.blockedUsers || []).includes(currentUser.id));
    }, [users, currentUser]);

    const populatePost = useCallback((postFromApi: any, userMapToUse: Map<string, User>): Post | null => {
        const { user: author, ...restOfPost } = postFromApi;
        if (!author) return null;
        return {
            ...restOfPost,
            author,
            comments: restOfPost.comments ? restOfPost.comments.map((comment: any) => {
                const { user, ...restOfComment } = comment;
                return { ...restOfComment, author: user };
            }).filter((c: any) => c.author) : [],
        };
    }, []);

    // --- Fetch Actions (Lazy Loading) ---

    // 1. Global Essential (Users & Notifications) - Runs on App Init
    const fetchGlobalEssential = useCallback(async () => {
        if (!currentUser) return;
        try {
            // Fetch users (top 20) in background for search/avatars
            api.fetchUsers().then(({ data }) => setUsers(data)).catch(console.error);
            // Fetch notifications
            api.fetchNotifications().then(({ data }) => setNotifications(data)).catch(console.error);
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Global fetch error:", error);
        }
    }, [currentUser, setNotifications]);

    // 2. Feed & Stories (Home Page)
    const fetchFeed = useCallback(async () => {
        if (!currentUser || posts.length > 0) return; // Dedupe if already loaded (or add forceRefresh arg later)
        setIsFetching(true);
        try {
            const { data } = await api.fetchFeedPosts(1, 10);
            const populatedPosts = data.map((post: any) => populatePost(post, new Map())).filter(Boolean);
            setPosts(populatedPosts as Post[]);
            setFeedPage(1);
            setFeedHasMore(data.length === 10);

            // Stories often go with Feed
            api.fetchMyStories().then(({ data }) => setMyStories(data)).catch(console.error);
            api.fetchFollowingStories().then(({ data }) => setFollowingUserStories(data)).catch(console.error);
        } catch (error) {
            console.error("Feed fetch error:", error);
        } finally {
            setIsFetching(false);
        }
    }, [currentUser, posts.length, populatePost]);

    // 3. Tribes (Tribes Page)
    const fetchTribes = useCallback(async () => {
        if (!currentUser) return;
        // Even if we have cached tribes, we refresh in background
        try {
            const { data } = await api.fetchTribes();
            // Preserve messages if they exist in state but not in basic fetch
            setTribes(prev => {
                const prevMap = new Map(prev.map(t => [t.id, t]));
                return data.map((t: any) => {
                    const existing = prevMap.get(t.id);
                    return { ...t, messages: existing ? existing.messages : [] };
                });
            });
        } catch (error) {
            console.error("Tribes fetch error:", error);
        }
    }, [currentUser]);

    // 4. Detailed Users (Discover Page) - Existing `fetchUsers` is small, so we can re-use or expand.
    // For now, `fetchGlobalEssential` covers the basic list.

    // Old fetchData alias for backward compatibility (optional, but cleaner to remove)
    // const fetchData = useCallback(async () => { await fetchGlobalEssential(); await fetchFeed(); await fetchTribes(); }, [fetchGlobalEssential, fetchFeed, fetchTribes]);

    // Initial Essential Load (Users, Notifications)
    useEffect(() => {
        if (!isAuthLoading && currentUser) {
            fetchGlobalEssential();
        }
    }, [isAuthLoading, currentUser, fetchGlobalEssential]);


    // --- Load More ---
    const handleLoadMoreFeed = useCallback(async () => {
        if (isLoadingMore || !feedHasMore) return;
        setIsLoadingMore(true);
        const nextPage = feedPage + 1;
        try {
            const { data } = await api.fetchFeedPosts(nextPage, 10);
            if (data.length === 0) {
                setFeedHasMore(false);
            } else {
                const populatedNew = data.map((post: any) => populatePost(post, userMap)).filter(Boolean) as Post[];
                setPosts(prev => {
                    const postMap = new Map(prev.map(p => [p.id, p]));
                    populatedNew.forEach(p => postMap.set(p.id, p));
                    return Array.from(postMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                });
                setFeedPage(nextPage);
                if (data.length < 10) setFeedHasMore(false);
            }
        } catch (e) {
            console.error("Load more feed failed", e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [feedPage, feedHasMore, isLoadingMore, userMap, populatePost]);

    const handleLoadMoreDiscover = useCallback(async () => {
        if (isLoadingMore || !discoverHasMore) return;
        setIsLoadingMore(true);
        const nextPage = discoverPage + 1;
        try {
            const { data } = await api.fetchPosts(nextPage, 20);
            if (data.length === 0) {
                setDiscoverHasMore(false);
            } else {
                const populatedNew = data.map((post: any) => populatePost(post, userMap)).filter(Boolean) as Post[];
                setPosts(prev => {
                    const postMap = new Map(prev.map(p => [p.id, p]));
                    populatedNew.forEach(p => postMap.set(p.id, p));
                    return Array.from(postMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                });
                setDiscoverPage(nextPage);
                if (data.length < 20) setDiscoverHasMore(false);
            }
        } catch (e) {
            console.error("Load more discover failed", e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [discoverPage, discoverHasMore, isLoadingMore, userMap, populatePost]);


    // --- Socket Listeners ---
    useEffect(() => {
        if (socket && tribes.length > 0 && currentUser) {
            tribes.filter(t => t.members.includes(currentUser.id)).forEach(t => {
                socket.emit('joinRoom', `tribe-${t.id}`);
            });
        }
    }, [socket, tribes, currentUser]);

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

        const handleUserUpdated = (updatedUser: User) => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            if (currentUser?.id === updatedUser.id) {
                // ✅ FIX: Merge updates but preserve following/followers to keep optimistic updates
                setCurrentUser(prev => ({
                    ...updatedUser,
                    following: prev.following,  // Preserve optimistic follow updates
                    followers: prev.followers,  // Preserve optimistic follower updates
                }));
            }
        };

        const handleTribeDeleted = (tribeId: string) => {
            setTribes(prev => prev.filter(t => t.id !== tribeId));
            // Navigation handling for deleted tribe should be in Component or specific listener
            if (editingTribe?.id === tribeId) setEditingTribe(null);
        };

        socket.on('newPost', handleNewPost);
        socket.on('postUpdated', handlePostUpdated);
        socket.on('postDeleted', handlePostDeleted);
        socket.on('userUpdated', handleUserUpdated);
        socket.on('tribeDeleted', handleTribeDeleted);
        // Note: New Tribe Message handling is mostly for counts (SocketContext) or specific Tribe Detail page

        return () => {
            socket.off('newPost', handleNewPost);
            socket.off('postUpdated', handlePostUpdated);
            socket.off('postDeleted', handlePostDeleted);
            socket.off('userUpdated', handleUserUpdated);
            socket.off('tribeDeleted', handleTribeDeleted);
        };
    }, [socket, userMap, populatePost, currentUser?.id, setCurrentUser, editingTribe]);


    // --- Actions ---

    const handleAddPost = async (content: string, imageUrl?: string, mediaType?: 'image' | 'video', duration?: number) => {
        if (!currentUser) return;
        setIsCreatingPost(true);
        const tempId = Date.now().toString();
        const tempPost: Post = {
            id: `temp-${tempId}`,
            author: currentUser,
            content,
            imageUrl,
            mediaType: mediaType || 'image',
            duration,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: [],
        };
        setPosts(prev => [tempPost, ...prev]);

        try {
            await api.createPost({ content, imageUrl, tempId, mediaType, duration });
            toast.success("Post created successfully!");
        } catch (error) {
            console.error("Failed to add post:", error);
            toast.error("Could not create post.");
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
                // Simple toggle for optimistic UI - counts are better handled by backend response but this is fine for now
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
        const originalPosts = posts;
        setPosts(prev => prev.filter(p => p.id !== postId));
        try {
            await api.deletePost(postId);
            toast.success("Post deleted.");
        } catch (error) {
            const message = (error as any)?.response?.data?.message || 'Failed to delete post';
            console.error("Failed to delete post:", message, error);
            toast.error("Could not delete post.");
            setPosts(originalPosts);
        }
    };

    const handleHidePost = async (postId: string) => {
        const originalPosts = posts;
        setPosts(prev => prev.filter(p => p.id !== postId));
        try {
            await api.hidePost(postId);
            toast.success("Post hidden.");
        } catch (error) {
            const message = (error as any)?.response?.data?.message || 'Failed to hide post';
            console.error("Failed to hide post:", message, error);
            toast.error("Could not hide post.");
            setPosts(originalPosts);
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
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
        const messageText = post.content.startsWith('Shared Story')
            ? post.content
            : `Shared Post\n/post/${post.id}?owner=${post.author?.username || 'user'}\n${post.content}`;

        const messageData = {
            text: messageText,
            imageUrl: post.imageUrl,
            sender: currentUser,
            timestamp: new Date().toISOString(),
        };
        try {
            if (destination.type === 'tribe') {
                await api.sendTribeMessage(destination.id, { text: messageData.text, imageUrl: messageData.imageUrl });
                toast.success(`Post shared to tribe!`);
            } else {
                await api.sendMessage(destination.id, { message: messageData.text, imageUrl: messageData.imageUrl });
                toast.success(`Post shared with user!`);
            }
        } catch (error) {
            console.error("Failed to share post:", error);
            toast.error("Could not share post.");
        }
    };

    // Follow/Block/User
    const handleToggleFollow = async (targetUserId: string, viewedUser?: User | null, setViewedUser?: React.Dispatch<React.SetStateAction<User | null>>) => {
        if (!currentUser || currentUser.id === targetUserId) return;
        const originalCurrentUser = { ...currentUser };
        // Helper to update following list safely
        setCurrentUser(prev => {
            if (!prev) return null;
            const currentFollowing = Array.isArray(prev.following) ? prev.following : [];
            const isAlreadyFollowing = currentFollowing.includes(targetUserId);
            // Optimistic Toggle
            return {
                ...prev,
                following: isAlreadyFollowing ? currentFollowing.filter(id => id !== targetUserId) : [...currentFollowing, targetUserId],
                followingCount: (prev.followingCount || 0) + (isAlreadyFollowing ? -1 : 1)
            };
        });

        // If defined outside, update the local view state too
        if (viewedUser && setViewedUser && viewedUser.id === targetUserId) {
            setViewedUser(prev => {
                if (!prev) return null;
                const currentFollowers = Array.isArray(prev.followers) ? prev.followers : [];
                const isFollowedByMe = currentFollowers.includes(currentUser.id);
                return {
                    ...prev,
                    followers: isFollowedByMe ? currentFollowers.filter(id => id !== currentUser.id) : [...currentFollowers, currentUser.id],
                    followersCount: (prev.followersCount || 0) + (isFollowedByMe ? -1 : 1),
                    isFollowedByCurrentUser: !isFollowedByMe
                };
            });
        }

        try {
            await api.toggleFollow(targetUserId);
        } catch (error) {
            console.error('Failed to follow', error);
            toast.error("Action failed.");
            setCurrentUser(originalCurrentUser);
            // Revert view user logic if complex or just reload
        }
    };

    const handleToggleBlock = async (targetUserId: string) => {
        if (!currentUser) return false;
        const originalUser = { ...currentUser };
        const isBlocked = (currentUser.blockedUsers || []).includes(targetUserId);
        setCurrentUser(prev => prev ? { ...prev, blockedUsers: isBlocked ? (prev.blockedUsers || []).filter(id => id !== targetUserId) : [...(prev.blockedUsers || []), targetUserId] } : null);
        try {
            await api.toggleBlock(targetUserId);
            toast.success(isBlocked ? "User unblocked." : "User blocked successfully");
            return true;
        } catch (error) {
            console.error('Failed to block', error);
            toast.error("Action failed.");
            setCurrentUser(originalUser);
            return false;
        }
    };

    const handleUpdateUser = async (updatedUserData: Partial<User>) => {
        try {
            await api.updateProfile(updatedUserData);
            toast.success("Profile updated!");
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.deleteAccount();
            toast.success("Account deleted.");
            logout();
        } catch (error) {
            console.error("Failed to delete account:", error);
            toast.error("Could not delete account.");
        }
    };

    // Tribes
    const handleJoinToggle = async (tribeId: string, viewedTribe?: Tribe | null, setViewedTribe?: React.Dispatch<React.SetStateAction<Tribe | null>>) => {
        try {
            // Check if this is a private tribe and user is trying to join (not leave)
            const tribe = tribes.find(t => t.id === tribeId) || viewedTribe;
            const isCurrentlyMember = tribe && currentUser && tribe.members.includes(currentUser.id);

            if (tribe?.isPrivate && !isCurrentlyMember) {
                // Request to join instead of direct join
                const { data: updatedTribe } = await api.requestJoinTribe(tribeId);
                setTribes(prev => prev.map(t => t.id === tribeId ? { ...t, joinRequests: updatedTribe.joinRequests } : t));
                if (viewedTribe && setViewedTribe && viewedTribe.id === tribeId) {
                    setViewedTribe(prev => prev ? { ...prev, joinRequests: updatedTribe.joinRequests } : null);
                }
                toast.success('Join request sent! Waiting for Chief approval.');
            } else {
                // Normal join/leave
                const { data: updatedTribe } = await api.joinTribe(tribeId);
                setTribes(prev => prev.map(t => t.id === tribeId ? { ...t, members: updatedTribe.members } : t));
                if (viewedTribe && setViewedTribe && viewedTribe.id === tribeId) {
                    setViewedTribe(prev => prev ? { ...prev, members: updatedTribe.members } : null);
                }
            }
        } catch (error: any) {
            console.error("Failed to join/leave tribe:", error);
            toast.error(error.response?.data?.message || 'Failed to process request.');
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

    // Updated to accept viewedTribe setters to sync local view if active
    const handleEditTribe = async (tribeId: string, name: string, description: string, avatarUrl?: string | null, viewedTribe?: Tribe | null, setViewedTribe?: React.Dispatch<React.SetStateAction<Tribe | null>>) => {
        try {
            const { data: updatedTribeData } = await api.updateTribe(tribeId, { name, description, avatarUrl });
            setTribes(prev => prev.map(t => (t.id === tribeId ? { ...t, ...updatedTribeData } : t)));
            if (viewedTribe && setViewedTribe && viewedTribe.id === tribeId) {
                setViewedTribe(prev => prev ? { ...prev, ...updatedTribeData } : null);
            }
            setEditingTribe(null);
            toast.success("Tribe details updated.");
        } catch (error) {
            console.error("Failed to edit tribe:", error);
        }
    };

    const handleDeleteTribe = async (tribeId: string) => {
        try {
            await api.deleteTribe(tribeId);
            setTribes(prev => prev.filter(t => t.id !== tribeId));
            if (editingTribe?.id === tribeId) setEditingTribe(null);
            toast.success("Tribe deleted.");
        } catch (error) {
            console.error("Failed to delete tribe", error);
            toast.error("Could not delete tribe.");
        }
    };

    // Stories
    const handleCreateStory = async (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => {
        try {
            const { data: newStory } = await api.createStory(storyData);
            setMyStories(prev => [newStory, ...prev]);
            setIsCreatingStory(false);
            handleViewUserStories(currentUser!.id, [newStory, ...myStories]);
            toast.success("Story posted!");
        } catch (error) {
            console.error("Failed to create story:", error);
            toast.error("Could not post story.");
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
                        return { ...story, likes: isLiked ? story.likes.filter(id => id !== currentUser.id) : [...story.likes, currentUser.id] };
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
            setFollowingUserStories(originalFollowingStories);
        }
    };

    const handleViewUserStories = async (userId: string, stories?: Story[], initialStoryId?: string) => {
        let userStoryData;
        if (userId === currentUser?.id) {
            userStoryData = { user: currentUser, stories: stories || myStories, initialStoryId };
        } else {
            const foundUserStories = followingUserStories.find(us => us.user.id === userId);
            if (foundUserStories) {
                userStoryData = { ...foundUserStories, initialStoryId };
            } else {
                // Fetch if not found
                let user = userMap.get(userId) || users.find(u => u.id === userId);
                if (!user) {
                    try {
                        const { data } = await api.fetchUser(userId);
                        user = data;
                    } catch (e) { console.error(e); }
                }
                if (user) {
                    try {
                        const { data: fetchedStories } = await api.fetchUserStories(userId);
                        if (fetchedStories.length > 0) userStoryData = { user, stories: fetchedStories, initialStoryId };
                        else toast.info("No stories available.");
                    } catch (e) { console.error(e); }
                }
            }
        }
        if (userStoryData && userStoryData.stories.length > 0) {
            setViewingUserStories(userStoryData);
            setSeenStoryAuthors(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
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
                        const exists = prev.some(p => p.id === populatedPost.id);
                        return exists ? prev : [populatedPost, ...prev];
                    });
                    post = populatedPost;
                }
            } catch (error) {
                console.error("Failed to fetch post", error);
                toast.error("Post not found.");
                return;
            }
        }
        if (post) setViewingPost(post);
    };

    const value = {
        users, posts, tribes, myStories, followingUserStories,
        isDataLoaded, isFetching, isCreatingPost,
        feedPage, feedHasMore, discoverPage, discoverHasMore, isLoadingMore,
        userMap, visiblePosts, visibleUsers,
        viewingPost, setViewingPost,
        viewingUserStories, setViewingUserStories,
        isCreatingStory, setIsCreatingStory,
        editingTribe, setEditingTribe,
        fetchGlobalEssential, fetchFeed, fetchTribes, handleLoadMoreFeed, handleLoadMoreDiscover,
        handleAddPost, handleLikePost, handleCommentPost, handleDeletePost, handleHidePost, handleDeleteComment, handleSharePost,
        handleToggleFollow, handleToggleBlock, handleUpdateUser, handleDeleteAccount,
        handleJoinToggle, handleCreateTribe, handleEditTribe, handleDeleteTribe,
        handleCreateStory, handleDeleteStory, handleLikeStory,
        handleViewPost, handleViewUserStories
    };

    return <GlobalContentContext.Provider value={value}>{children}</GlobalContentContext.Provider>;
};
