
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Post, User, Tribe } from '../../types';
import PostCard from '../feed/PostCard';
import UserCard from '../users/UserCard';
import TribeCard from '../tribes/TribeCard';

interface DiscoverPageProps {
    posts: Post[];
    users: User[];
    tribes: Tribe[];
    currentUser: User;
    onLikePost: (postId: string) => void;
    onCommentPost: (postId: string, text: string) => void;
    onDeletePost: (postId: string) => void;
    onHidePost?: (postId: string) => void;
    onDeleteComment: (postId: string, commentId: string) => void;
    onToggleFollow: (targetUserId: string) => void;
    onViewProfile: (user: User) => void;
    onViewTribe: (tribe: Tribe) => void;
    onJoinToggle: (tribeId: string) => Promise<void>;
    onEditTribe: (tribe: Tribe) => void;
    onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
    onReportPost: (postId: string) => void;
    onLoadMore: () => void;
    hasMore?: boolean;
}

const DiscoverPage: React.FC<DiscoverPageProps> = (props) => {
    const { posts, users, tribes, currentUser, onToggleFollow, onViewProfile, onLikePost, onCommentPost, onDeletePost, onHidePost, onDeleteComment, onViewTribe, onJoinToggle, onEditTribe, onSharePost, onReportPost, onLoadMore, hasMore } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'tribes'>('users');
    const [cachedUsers, setCachedUsers] = useState<User[]>([]);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && onLoadMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [observerTarget, hasMore, onLoadMore]);

    // Debounce Search Term (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load cached users immediately on mount
    useEffect(() => {
        const cached = localStorage.getItem('tribe_storage_discover_users');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setCachedUsers(parsed);
                }
            } catch (error) {
                console.error('Failed to parse cached discover users', error);
            }
        }
    }, []);

    // Update cache when users change
    useEffect(() => {
        if (users.length > 0) {
            try {
                localStorage.setItem('tribe_storage_discover_users', JSON.stringify(users.slice(0, 50)));
            } catch (error) {
                console.error('Failed to cache discover users', error);
            }
        }
    }, [users]);

    useEffect(() => {
        onLoadMore();
    }, [onLoadMore]);

    // Use cached users as fallback if real users haven't loaded yet
    const displayUsers = users.length > 0 ? users : cachedUsers;
    const otherUsers = useMemo(() => {
        return displayUsers
            .filter(u => u.id !== currentUser.id)
            .sort((a, b) => b.id.localeCompare(a.id)); // Sort by ID descending (Newest first)
    }, [displayUsers, currentUser.id]);

    const filteredResults = useMemo(() => {
        const term = debouncedSearch.toLowerCase().trim();
        if (!term) return null;

        const tagMatch = term.match(/^#(\w+)/);
        if (tagMatch) {
            const tag = tagMatch[1];
            return {
                users: [],
                posts: posts.filter(p => (p.content || '').toLowerCase().includes(`#${tag}`)),
                tribes: []
            };
        }

        const userMatch = term.match(/^@(\w+)/);
        if (userMatch) {
            const username = userMatch[1];
            return {
                users: otherUsers.filter(u => (u.username || '').toLowerCase().includes(username)),
                posts: [],
                tribes: []
            };
        }

        // General search - Added safety checks for null names/usernames
        return {
            users: otherUsers.filter(u =>
                (u.name || '').toLowerCase().includes(term) ||
                (u.username || '').toLowerCase().includes(term)
            ),
            posts: posts.filter(p => (p.content || '').toLowerCase().includes(term)),
            tribes: tribes.filter(t =>
                (t.name || '').toLowerCase().includes(term) ||
                (t.description || '').toLowerCase().includes(term)
            )
        };
    }, [searchTerm, posts, otherUsers, tribes]);

    React.useEffect(() => {
        if (filteredResults) {
            if (filteredResults.users.length > 0) setActiveTab('users');
            else if (filteredResults.tribes.length > 0) setActiveTab('tribes');
            else if (filteredResults.posts.length > 0) setActiveTab('posts');
            else setActiveTab('users');
        }
    }, [filteredResults]);

    return (
        <div>
            <h1 className="text-[28px] font-bold text-primary mb-6 font-display leading-[1.2]">Discover</h1>

            <div className="relative mb-8">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for people, tribes, or #tags..."
                    className="w-full bg-surface border border-border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                    <SearchIcon />
                </div>
            </div>

            {/* Conditional Rendering */}
            {!filteredResults ? (
                <div>
                    <h2 className="text-xl font-bold text-primary mb-4 font-display">Newest Users</h2>
                    <div className="space-y-3">
                        {otherUsers.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                onToggleFollow={onToggleFollow}
                                onViewProfile={onViewProfile}
                                layout="list"
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="border-b border-border mb-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <TabButton name="People" count={filteredResults.users.length} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                            <TabButton name="Tribes" count={filteredResults.tribes.length} isActive={activeTab === 'tribes'} onClick={() => setActiveTab('tribes')} />
                            <TabButton name="Posts" count={filteredResults.posts.length} isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                        </nav>
                    </div>

                    {activeTab === 'users' && (
                        filteredResults.users.length > 0 ? (
                            <div className="space-y-3">
                                {filteredResults.users.map(user => (
                                    <UserCard key={user.id} user={user} currentUser={currentUser} onToggleFollow={onToggleFollow} onViewProfile={onViewProfile} layout="list" />
                                ))}
                            </div>
                        ) : <p className="text-secondary text-center p-8">No people found for '{searchTerm}'.</p>
                    )}
                    {activeTab === 'tribes' && (
                        filteredResults.tribes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredResults.tribes.map(tribe => (
                                    <TribeCard key={tribe.id} tribe={tribe} currentUser={currentUser} allUsers={users} onJoinToggle={onJoinToggle} onEdit={onEditTribe} />
                                ))}
                            </div>
                        ) : <p className="text-secondary text-center p-8">No tribes found for '{searchTerm}'.</p>
                    )}
                    {activeTab === 'posts' && (
                        filteredResults.posts.length > 0 ? (
                            <div className="max-w-2xl mx-auto space-y-6">
                                {filteredResults.posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUser={currentUser}
                                        allUsers={users}
                                        allTribes={tribes}
                                        onLike={onLikePost}
                                        onComment={onCommentPost}
                                        onDeletePost={onDeletePost}
                                        onHidePost={onHidePost}
                                        onDeleteComment={onDeleteComment}
                                        onViewProfile={onViewProfile}
                                        onSharePost={onSharePost}
                                        onReportPost={onReportPost}
                                    />
                                ))}
                                {hasMore && (
                                    <div ref={observerTarget} className="py-8 flex justify-center w-full">
                                        <img src="/duckload.gif" alt="Loading..." className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                            </div>
                        ) : <p className="text-secondary text-center p-8">No posts found for '{searchTerm}'.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const TabButton: React.FC<{ name: string, count: number, isActive: boolean, onClick: () => void }> = ({ name, count, isActive, onClick }) => (
    <button onClick={onClick} className={`${isActive ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary hover:border-border'} group inline-flex items-center py-3 px-1 border-b-2 font-semibold text-sm transition-colors`}>
        {name}
        <span className={`${isActive ? 'bg-accent text-accent-text' : 'bg-border text-primary group-hover:bg-background'} ml-2 py-0.5 px-2 rounded-full text-xs font-bold`}>
            {count}
        </span>
    </button>
)

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default DiscoverPage;
