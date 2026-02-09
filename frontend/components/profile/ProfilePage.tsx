









// // FIX: Imported `useRef` to resolve reference errors in the EditProfileModal component.
// import React, { useState, useRef } from 'react';
// import { Post, User, Tribe, Story } from '../../types';
// import type { NavItem } from '../../App';
// import PostCard from '../feed/PostCard';
// import CreatePost from '../feed/CreatePost';
// import FollowListModal from './FollowListModal';
// import UserAvatar from '../common/UserAvatar';
// import ShareButton from '../common/ShareButton';
// import PostGridItem from './PostGridItem';
// import PostViewModal from './PostViewModal';

// interface ProfilePageProps {
//   user: User;
//   allUsers: User[];
//   visibleUsers: User[];
//   allTribes: Tribe[];
//   posts: Post[];
//   currentUser: User;
//   onLikePost: (postId: string) => void;
//   onCommentPost: (postId: string, text: string) => void;
//   onDeletePost: (postId: string) => void;
//   onDeleteComment: (postId: string, commentId: string) => void;
//   onViewProfile: (user: User) => void;
//   onUpdateUser: (updatedUser: Partial<User>) => void;
//   onAddPost: (content: string, imageUrl?: string) => void;
//   isPosting: boolean;
//   onToggleFollow: (targetUserId: string) => void;
//   onStartConversation: (user: User) => void;
//   onNavigate: (item: NavItem) => void;
//   onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
//   onOpenStoryCreator: () => void;
//   myStories: Story[];
//   onViewUserStories: (userId: string) => void;
// }

// export const ProfilePage: React.FC<ProfilePageProps> = (props) => {
//     const { 
//         user, allUsers, visibleUsers, allTribes, posts, currentUser, 
//         onLikePost, onCommentPost, onDeletePost, onDeleteComment, 
//         onViewProfile, onUpdateUser, onAddPost, isPosting, onToggleFollow, 
//         onStartConversation, onNavigate, onSharePost, onOpenStoryCreator,
//         myStories, onViewUserStories
//     } = props;
//     const [isEditModalOpen, setEditModalOpen] = useState(false);
//     const [followModal, setFollowModal] = useState<{isOpen: boolean, type: 'followers' | 'following', userIds: string[]}>({isOpen: false, type: 'followers', userIds: []});
//     const [optionsOpen, setOptionsOpen] = useState(false);
//     const [viewingPost, setViewingPost] = useState<Post | null>(null);


//   const isOwnProfile = user.id === currentUser.id;
//   const isFollowing = (currentUser.following || []).includes(user.id);

//   const openFollowModal = (type: 'followers' | 'following', userIds: string[]) => {
//     setFollowModal({isOpen: true, type, userIds});
//   }

//   const handleMessageClick = () => {
//       onStartConversation(user);
//   }

//   return (
//     <div>
//       <div className="bg-surface rounded-2xl shadow-sm border border-border mb-6 overflow-hidden">
//         <div className="h-48 md:h-64 bg-background rounded-t-2xl">
//             {user.bannerUrl ? <img src={user.bannerUrl} alt={`${user.name}'s banner`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-background via-surface to-background" />}
//         </div>

//         <div className="p-4 md:p-6 relative">
//             <div className="flex flex-col sm:flex-row justify-between items-start">
//                 <div className="sm:-mt-20 -mt-16 flex-shrink-0">
//                   <UserAvatar user={user} className="w-28 h-28 md:w-36 md:h-36 border-4 border-background" />
//                 </div>

//                 <div className="w-full sm:w-auto pt-2 sm:pt-4 flex items-center space-x-2">
//                     {isOwnProfile ? (
//                         <>
//                             <button onClick={() => onNavigate('Settings')} className="w-full sm:w-auto font-semibold px-4 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background flex items-center space-x-2">
//                                 <span>Settings</span>
//                                 <SettingsIcon />
//                             </button>
//                             <button onClick={() => setEditModalOpen(true)} className="w-full sm:w-auto bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors">
//                                 Edit Profile
//                             </button>
//                         </>
//                     ) : (
//                         <>
//                            <button onClick={handleMessageClick} className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background">Message</button>
//                            <button onClick={() => onToggleFollow(user.id)} className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-lg transition-colors ${ isFollowing ? 'bg-surface text-primary border border-border hover:bg-background' : 'bg-accent text-accent-text hover:bg-accent-hover' }`}>
//                                 {isFollowing ? 'Following' : 'Follow'}
//                             </button>
//                            <div className="relative">
//                                <button onClick={() => setOptionsOpen(!optionsOpen)} onBlur={() => setTimeout(() => setOptionsOpen(false), 150)} className="p-2 rounded-full bg-surface text-primary border border-border hover:bg-background" aria-label="More options"><OptionsIcon /></button>
//                                 {optionsOpen && (
//                                      <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border z-10">
//                                          <ShareButton shareData={{ title: `Check out ${user.name}'s profile on Tribe!`, text: `See what ${user.name} (@${user.username}) is up to.`, url: window.location.href }} className="w-full text-left px-4 py-2 text-primary hover:bg-background rounded-t-lg transition-colors flex items-center space-x-2" onShare={() => setOptionsOpen(false)}>
//                                              <ShareIcon /><span>Share Profile</span>
//                                          </ShareButton>
//                                          <button onClick={() => onStartConversation(user)} className={`w-full text-left px-4 py-2 hover:bg-background transition-colors flex items-center space-x-2 text-primary`}>
//                                             <BlockIcon /><span>Block User</span>
//                                          </button>
//                                      </div>
//                                 )}
//                            </div>
//                         </>
//                     )}
//                 </div>
//             </div>

//             <div className="mt-2">
//               <h1 className="text-3xl font-bold text-primary font-display">{user.name}</h1>
//               <p className="text-md text-secondary">@{user.username}</p>
//               <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
//                   <button onClick={() => openFollowModal('following', user.following || [])} className="hover:underline"><span className="font-bold text-primary">{(user.following || []).length}</span> <span className="text-secondary">Following</span></button>
//                   <button onClick={() => openFollowModal('followers', user.followers || [])} className="hover:underline"><span className="font-bold text-primary">{(user.followers || []).length}</span> <span className="text-secondary">Followers</span></button>
//               </div>
//               <p className="text-primary mt-4 max-w-2xl whitespace-pre-wrap">{user.bio}</p>
//             </div>
//         </div>
//       </div>

//       {isOwnProfile && <CreatePost currentUser={currentUser} allUsers={visibleUsers} myStories={myStories} onAddPost={onAddPost} isPosting={isPosting} onOpenStoryCreator={onOpenStoryCreator} onViewUserStories={onViewUserStories} />}

//       <h2 className="text-xl font-bold text-primary my-6 font-display">{isOwnProfile ? "Your Posts" : `${user.name.split(' ')[0]}'s Posts`}</h2>

//       {posts.length > 0 ? (
//         <div className="grid grid-cols-3 gap-1 md:gap-2">
//             {posts.map(post => (
//                 <PostGridItem key={post.id} post={post} onClick={() => setViewingPost(post)} />
//             ))}
//         </div>
//       ) : (
//         <div className="bg-surface p-8 text-center rounded-2xl border border-border">
//             <p className="text-secondary">No posts yet.</p>
//         </div>
//       )}

//       {viewingPost && (
//           <PostViewModal
//             post={viewingPost}
//             currentUser={currentUser}
//             allUsers={visibleUsers}
//             allTribes={allTribes}
//             onLike={onLikePost}
//             onComment={onCommentPost}
//             onDeletePost={onDeletePost}
//             onDeleteComment={onDeleteComment}
//             onViewProfile={(userToView) => { setViewingPost(null); onViewProfile(userToView); }}
//             onSharePost={onSharePost}
//             onClose={() => setViewingPost(null)}
//           />
//       )}

//       {isOwnProfile && isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setEditModalOpen(false)} onSave={onUpdateUser} />}

//       {followModal.isOpen && (
//         <FollowListModal title={followModal.type === 'followers' ? 'Followers' : 'Following'} userIds={followModal.userIds} allUsers={allUsers} currentUser={currentUser} onClose={() => setFollowModal({isOpen: false, type: 'followers', userIds: []})} onToggleFollow={onToggleFollow} onViewProfile={(userToView) => { setFollowModal({isOpen: false, type: 'followers', userIds: []}); onViewProfile(userToView); }} />
//       )}
//     </div>
//   );
// };

// // Edit Profile Modal
// interface EditProfileModalProps { user: User; onClose: () => void; onSave: (updatedUser: Partial<User>) => void; }
// const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
//     const [formData, setFormData] = useState({ name: user.name, username: user.username, bio: user.bio });
//     const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
//     const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerUrl);
//     const avatarInputRef = useRef<HTMLInputElement>(null);
//     const bannerInputRef = useRef<HTMLInputElement>(null);

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 if (type === 'avatar') setAvatarPreview(reader.result as string);
//                 if (type === 'banner') setBannerPreview(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         onSave({ ...formData, avatarUrl: avatarPreview, bannerUrl: bannerPreview });
//         onClose();
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-border">
//                 <div className="p-4 flex justify-between items-center border-b border-border"><h2 className="text-xl font-bold text-primary">Edit Profile</h2><button onClick={onClose} className="text-secondary hover:text-primary">&times;</button></div>
//                 <div className="overflow-y-auto">
//                     <div className="relative">
//                         <div className="h-40 bg-background">{bannerPreview ? <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-background via-surface to-background" />}</div>
//                         <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><button onClick={() => bannerInputRef.current?.click()} className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70"><CameraIcon /></button><input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" /></div>
//                         <div className="absolute bottom-0 left-4 translate-y-1/2">
//                             <div className="w-24 h-24 rounded-full border-4 border-surface bg-surface relative">
//                                 <UserAvatar user={{...user, avatarUrl: avatarPreview}} className="w-full h-full" />
//                                 <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><button onClick={() => avatarInputRef.current?.click()} className="bg-black/50 text-white rounded-full p-2"><CameraIcon /></button><input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" /></div>
//                             </div>
//                         </div>
//                     </div>
//                     <form onSubmit={handleSubmit} className="p-4 pt-16"><div className="space-y-4">
//                         <div><label className="text-sm font-semibold text-secondary">Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border border-border rounded-lg" /></div>
//                         <div><label className="text-sm font-semibold text-secondary">Username</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border border-border rounded-lg" /></div>
//                         <div><label className="text-sm font-semibold text-secondary">Bio</label><textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border border-border rounded-lg resize-none" /></div>
//                     </div></form>
//                 </div>
//                 <div className="p-4 flex justify-end items-center border-t border-border mt-auto"><button onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button><button onClick={handleSubmit} className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover">Save</button></div>
//             </div>
//         </div>
//     );
// };

// const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
// const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
// const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
// const BlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
// const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;











// FIX: Imported `useRef` to resolve reference errors in the EditProfileModal component.
import React, { useState, useRef, useEffect } from 'react';
import { Post, User, Tribe, Story } from '../../types';
import * as api from '../../api';
import type { NavItem } from '../../App';
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';
import FollowListModal from './FollowListModal';
import UserAvatar from '../common/UserAvatar';
import ShareButton from '../common/ShareButton';
import { toast } from '../common/Toast';
import PostGridItem from './PostGridItem';
import PostViewModal from './PostViewModal';
import MediaSelectionModal from '../common/MediaSelectionModal';

interface ProfilePageProps {
    user: User;
    allUsers: User[];
    visibleUsers: User[];
    allTribes: Tribe[];
    posts: Post[];
    currentUser: User;
    hasStory: boolean;
    onLikePost: (postId: string) => void;
    onCommentPost: (postId: string, text: string) => void;
    onDeletePost: (postId: string) => void;
    onHidePost?: (postId: string) => void;
    onDeleteComment: (postId: string, commentId: string) => void;
    onViewProfile: (user: User) => void;
    onUpdateUser: (updatedUser: Partial<User>) => void;
    onAddPost: (content: string, imageUrl?: string) => void;
    isPosting: boolean;
    onToggleFollow: (targetUserId: string) => void;
    onToggleBlock: (targetUserId: string) => Promise<boolean>;
    onStartConversation: (user: User) => void;
    onNavigate: (item: NavItem) => void;
    onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
    onOpenStoryCreator: () => void;
    myStories: Story[];
    onViewUserStories: (userId: string) => void;
    onReportPost: (postId: string) => void;
    onReportUser: (userId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = (props) => {
    const {
        user, allUsers, visibleUsers, allTribes, posts, currentUser, hasStory,
        onLikePost, onCommentPost, onDeletePost, onHidePost, onDeleteComment,
        onViewProfile, onUpdateUser, onAddPost, isPosting, onToggleFollow, onToggleBlock,
        onStartConversation, onNavigate, onSharePost, onOpenStoryCreator,
        myStories, onViewUserStories, onReportPost, onReportUser
    } = props;
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', username: '', bio: '' });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [mediaTarget, setMediaTarget] = useState<'avatar' | 'banner' | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarCameraRef = useRef<HTMLInputElement>(null);
    const bannerCameraRef = useRef<HTMLInputElement>(null);
    const [followModal, setFollowModal] = useState<{
        isOpen: boolean;
        type: 'followers' | 'following';
        users: User[];
        isLoading: boolean;
    }>({ isOpen: false, type: 'followers', users: [], isLoading: false });
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [profilePosts, setProfilePosts] = useState<Post[]>(posts);
    const [profileUser, setProfileUser] = useState<User>(user);
    const [isLoading, setIsLoading] = useState(false);

    // SYNC STATE WITH PROP (Critical for optimistic updates)
    // But ONLY if the ID changes. We don't want to overwrite local optimistic state with stale parent props 
    // during a follow action unless it's a genuine navigation.
    useEffect(() => {
        if (user.id !== profileUser.id) {
            setProfileUser(user);
        }
    }, [user, profileUser.id]);

    // FETCH FULL USER PROFILE (Fixes 0 counts / missing banner)
    useEffect(() => {
        // FIX: If we already have a valid profile with counts, don't refetch aggressively unless ID changed
        if (!user.id) return;

        const fetchFullProfile = async () => {
            try {
                const { data } = await api.fetchUser(user.id);
                // Only update if IDs match (avoid race conditions)
                // AND if we are still mounted (React handles this but good to be careful logic-wise)
                if (data && data.id === user.id) {
                    setProfileUser(prev => ({
                        ...prev, // Keep existing client state if fresher? No, server is truth mostly, but array lengths might be stale.
                        ...data,
                        // Ensure we don't accidentally zero out counts if server sends undefined
                        followersCount: data.followersCount !== undefined ? data.followersCount : (data.followers || []).length,
                        followingCount: data.followingCount !== undefined ? data.followingCount : (data.following || []).length
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch full profile:", error);
            }
        };
        fetchFullProfile();
    }, [user.id]);

    // FETCH USER POSTS (Phase 3 Requirement)
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                // Fetch specifically from the new user posts endpoint
                const { data } = await api.fetchUserPosts(user.id);
                if (data && Array.isArray(data) && data.length > 0) {
                    const mapped = data.map((p: any) => ({ ...p, author: p.user || user }));
                    setProfilePosts(mapped);
                } else {
                    // Fallback to props (cached)
                    setProfilePosts(posts);
                }
            } catch (error) {
                setProfilePosts(posts);
            } finally {
                setIsLoading(false);
            }
        };

        if (user.id) {
            fetchPosts();
        }
    }, [user.id, posts]); // Dependency on posts allows generic updates too

    const handleLike = (postId: string) => {
        onLikePost(postId);
        setProfilePosts(prev => prev.map(p => {
            if (p.id === postId) {
                const isLiked = p.likes.includes(currentUser.id);
                return { ...p, likes: isLiked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] };
            }
            return p;
        }));
    }



    const handleDelete = (postId: string) => {
        onDeletePost(postId);
        setProfilePosts(prev => prev.filter(p => p.id !== postId));
        toast.success("Post deleted successfully");
    }


    const isOwnProfile = user.id === currentUser.id;
    // Strict safety check for isFollowing
    const isFollowing = Array.isArray(currentUser.following) && currentUser.following.includes(user.id);
    const isBlocked = Array.isArray(currentUser.blockedUsers) && currentUser.blockedUsers.includes(user.id);
    const canViewLists = isOwnProfile || isFollowing;

    const openFollowModal = async (type: 'followers' | 'following') => {
        setFollowModal({ isOpen: true, type, users: [], isLoading: true });
        try {
            const response = type === 'followers'
                ? await api.fetchUserFollowers(safeUser.id)
                : await api.fetchUserFollowing(safeUser.id);
            const list = Array.isArray(response.data) ? response.data : [];
            if (!Array.isArray(response.data)) {
                toast.error("Unable to load list.");
            }
            setFollowModal({ isOpen: true, type, users: list, isLoading: false });
        } catch (error) {
            setFollowModal({ isOpen: true, type, users: [], isLoading: false });
            toast.error("Unable to load list.");
        }
    }

    const handleMessageClick = () => {
        onStartConversation(profileUser);
    }

    // FIX: Optimistic update for follow/unfollow
    const handleToggleFollow = () => {
        // 1. Call API/Parent handler
        onToggleFollow(profileUser.id);

        // 2. Optimistic Update Local State
        const safeFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
        const isFollowing = safeFollowing.includes(profileUser.id);
        const willBeFollowing = !isFollowing;

        setProfileUser(prev => {
            const currentFollowers = Array.isArray(prev.followers) ? prev.followers : [];
            let newFollowers;

            if (willBeFollowing) {
                // Add current user to followers if not already there
                if (!currentFollowers.includes(currentUser.id)) {
                    newFollowers = [...currentFollowers, currentUser.id];
                } else {
                    newFollowers = currentFollowers;
                }
            } else {
                // Remove current user from followers
                newFollowers = currentFollowers.filter(id => id !== currentUser.id);
            }

            return {
                ...prev,
                followers: newFollowers,
                // Optimistically update counts
                followersCount: (prev.followersCount !== undefined)
                    ? Math.max(0, prev.followersCount + (willBeFollowing ? 1 : -1))
                    : newFollowers.length,
                isFollowedByCurrentUser: willBeFollowing
            };
        });
    }

    // GUARD: Ensure we always have a user to render.
    // Use profileUser (state) if available, otherwise fall back to user (prop).
    // NEVER return null.

    const safeUser = profileUser || user;
    if (!safeUser) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    const displayedAvatar = isEditingProfile ? avatarPreview : safeUser.avatarUrl;
    const displayedBanner = isEditingProfile ? bannerPreview : safeUser.bannerUrl;

    const startEditing = () => {
        if (!currentUser) return;
        setEditForm({ name: currentUser.name || '', username: currentUser.username || '', bio: currentUser.bio || '' });
        setAvatarPreview(currentUser.avatarUrl || null);
        setBannerPreview(currentUser.bannerUrl || null);
        setIsEditingProfile(true);
    };

    const cancelEditing = () => {
        setIsEditingProfile(false);
        setEditForm({ name: currentUser.name || '', username: currentUser.username || '', bio: currentUser.bio || '' });
        setAvatarPreview(currentUser.avatarUrl || null);
        setBannerPreview(currentUser.bannerUrl || null);
    };

    const handleSaveProfile = () => {
        onUpdateUser({ ...editForm, avatarUrl: avatarPreview, bannerUrl: bannerPreview });
        setIsEditingProfile(false);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'avatar') setAvatarPreview(reader.result as string);
                if (type === 'banner') setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            if (e.target.value) e.target.value = '';
        }
    };

    const openMediaModal = (target: 'avatar' | 'banner') => {
        setMediaTarget(target);
        setIsMediaModalOpen(true);
    };

    return (
        <div>
            <div className="bg-surface rounded-2xl shadow-sm border border-border mb-6">
                <div className="h-48 md:h-64 bg-background rounded-t-2xl overflow-hidden relative">
                    {safeUser.id === 'chuk-ai' ? (
                        <img src="/psy-banner.gif" alt="Psyduck Banner" className="w-full h-full object-cover" />
                    ) : displayedBanner ? (
                        <img src={displayedBanner} alt={`${safeUser.name || "User"}'s banner`} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-background via-surface to-background" />
                    )}
                    {isOwnProfile && isEditingProfile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <button
                                type="button"
                                onClick={() => openMediaModal('banner')}
                                className="rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                                aria-label="Update banner"
                            >
                                <CameraIcon />
                            </button>
                            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
                            <input type="file" ref={bannerCameraRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" capture="environment" className="hidden" />
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-6 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div
                            className="sm:-mt-20 -mt-16 flex-shrink-0 cursor-pointer relative"
                            onClick={hasStory ? () => onViewUserStories(safeUser.id) : undefined}
                        >
                            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full p-1 ${hasStory ? 'bg-accent' : 'bg-transparent'}`}>
                                <UserAvatar user={{ ...safeUser, avatarUrl: displayedAvatar }} className="w-full h-full border-4 border-surface" />
                            </div>
                            {isOwnProfile && isEditingProfile && (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openMediaModal('avatar');
                                    }}
                                    className="absolute bottom-1 right-1 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                                    aria-label="Update avatar"
                                >
                                    <CameraIcon />
                                </button>
                            )}
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" />
                            <input type="file" ref={avatarCameraRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" capture="environment" className="hidden" />
                        </div>

                        <div className="w-full sm:w-auto pt-2 sm:pt-4 flex flex-wrap items-center gap-2">
                            {isOwnProfile ? (
                                <>
                                    {!isEditingProfile && (
                                        <button type="button" onClick={() => onNavigate('Settings')} className="flex-1 sm:flex-none font-semibold px-4 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background flex items-center justify-center space-x-2">
                                            <span>Settings</span>
                                            <SettingsIcon />
                                        </button>
                                    )}
                                    {isEditingProfile ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="w-full sm:w-auto flex-1 sm:flex-none font-semibold px-4 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                className="w-full sm:w-auto flex-1 sm:flex-none bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors"
                                            >
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startEditing}
                                            className="flex-1 sm:flex-none bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button type="button" onClick={() => handleMessageClick()} className="flex-1 sm:flex-none font-semibold px-6 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background">Message</button>
                                    {safeUser.id !== 'chuk-ai' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleFollow();
                                            }}
                                            }}
                                    className={`flex-1 sm:flex-none font-semibold px-6 py-2 rounded-lg transition-colors ${isFollowing ? 'bg-surface text-primary border border-border hover:bg-background' : 'bg-accent text-accent-text hover:bg-accent-hover'}`}
                                        >
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                                    )}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setOptionsOpen(!optionsOpen);
                                    }}
                                    onBlur={() => setTimeout(() => setOptionsOpen(false), 150)}
                                    className="p-2 rounded-full bg-surface text-primary border border-border hover:bg-background"
                                    aria-label="More options"
                                >
                                    <OptionsIcon />
                                </button>
                                {optionsOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border z-10 overflow-hidden">
                                        <ShareButton shareData={{ title: `Check out ${safeUser.name}'s profile on Tribe!`, text: `See what ${safeUser.name} (@${safeUser.username}) is up to.`, url: window.location.href }} className="w-full text-left px-4 py-3 text-primary hover:bg-background transition-colors flex items-center space-x-2" onShare={() => setOptionsOpen(false)}>
                                            <ShareIcon className="h-5 w-5" /><span>Share Profile</span>
                                        </ShareButton>
                                        <button onClick={() => { onReportUser(safeUser.id); setOptionsOpen(false); }} className={`w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-500 transition-colors flex items-center space-x-2`}>
                                            <FlagIcon className="h-5 w-5" /><span>Report User</span>
                                        </button>
                                        <button onClick={async () => {
                                            // @ts-ignore
                                            const success = await onToggleBlock(safeUser.id);
                                            setOptionsOpen(false);
                                            if (success && !isBlocked) {
                                                onNavigate('Discover');
                                            }
                                        }} className={`w-full text-left px-4 py-3 hover:bg-background transition-colors flex items-center space-x-2 ${isBlocked ? 'text-secondary' : 'text-red-500'} border-t border-border`}>
                                            <BlockIcon className="h-5 w-5" /><span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                            )}
                    </div>
                </div>

                <div className="mt-2">
                    {isEditingProfile ? (
                        <div className="grid gap-3 max-w-2xl">
                            <div>
                                <label className="text-xs font-semibold text-secondary">Name</label>
                                <input
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditInputChange}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-secondary">Username</label>
                                <input
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleEditInputChange}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-primary font-display">{safeUser.name || "User"}</h1>
                            <p className="text-md text-secondary">@{safeUser.username || "user"}</p>
                        </>
                    )}
                    {safeUser.id === 'chuk-ai' ? (
                        <div className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <p className="text-sm text-primary italic">
                                "Psy... Psyduck has hidden his followers & following list with his Psychic ability! (But he might secretly follow you... Psy!)" 🦆🌀
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            <button
                                type="button"
                                onClick={() => canViewLists && openFollowModal('following')}
                                className={`hover:underline ${!canViewLists ? 'cursor-not-allowed opacity-50' : ''}`}
                                title={!canViewLists ? "Follow to view lists" : ""}
                            >
                                <span className="font-bold text-primary">
                                    {safeUser.followingCount !== undefined
                                        ? safeUser.followingCount
                                        : (Array.isArray(safeUser.following) ? safeUser.following.length : 0)}
                                </span> <span className="text-secondary">Following</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => canViewLists && openFollowModal('followers')}
                                className={`hover:underline ${!canViewLists ? 'cursor-not-allowed opacity-50' : ''}`}
                                title={!canViewLists ? "Follow to view lists" : ""}
                            >
                                <span className="font-bold text-primary">
                                    {safeUser.followersCount !== undefined
                                        ? safeUser.followersCount
                                        : (Array.isArray(safeUser.followers) ? safeUser.followers.length : 0)}
                                </span> <span className="text-secondary">Followers</span>
                            </button>
                        </div>
                    )}
                    {isEditingProfile ? (
                        <div className="mt-4 max-w-2xl">
                            <label className="text-xs font-semibold text-secondary">Bio</label>
                            <textarea
                                name="bio"
                                value={editForm.bio}
                                onChange={handleEditInputChange}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                    ) : (
                        <p className="text-primary mt-4 max-w-2xl whitespace-pre-wrap">{safeUser.bio}</p>
                    )}
                </div>
            </div>
        </div>

            { isOwnProfile && <CreatePost currentUser={currentUser} allUsers={visibleUsers} myStories={myStories} onAddPost={onAddPost} isPosting={isPosting} onOpenStoryCreator={onOpenStoryCreator} onViewUserStories={onViewUserStories} /> }

    <h2 className="text-xl font-bold text-primary my-6 font-display">{isOwnProfile ? "Your Posts" : `${(safeUser.name || "User").split(' ')[0]}'s Posts`}</h2>

    {
        isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : profilePosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
                {profilePosts.map(post => (
                    <PostGridItem key={post.id} post={post} onClick={() => setViewingPost(post)} />
                ))}
            </div>
        ) : (
            <div className="bg-surface p-8 text-center rounded-2xl border border-border">
                <p className="text-secondary">
                    {!isOwnProfile && !isFollowing ? (
                        <>Follow <span className="font-bold text-primary">{safeUser.name.split(' ')[0]}</span> to see their posts</>
                    ) : (
                        "No posts yet."
                    )}
                </p>
            </div>
        )
    }

    {
        viewingPost && (
            <PostViewModal
                post={viewingPost}
                currentUser={currentUser}
                allUsers={visibleUsers}
                allTribes={allTribes}
                onLike={handleLike}
                onComment={onCommentPost}
                onDeletePost={handleDelete}
                onHidePost={onHidePost}
                onDeleteComment={onDeleteComment}
                onViewProfile={(userToView) => { setViewingPost(null); onViewProfile(userToView); }}
                onSharePost={onSharePost}
                onReportPost={onReportPost}
                onClose={() => setViewingPost(null)}
            />
        )
    }

    {
        followModal.isOpen && (
            <FollowListModal
                title={followModal.type === 'followers' ? 'Followers' : 'Following'}
                users={followModal.users}
                currentUser={currentUser}
                onClose={() => setFollowModal({ isOpen: false, type: 'followers', users: [], isLoading: false })}
                onToggleFollow={onToggleFollow}
                onViewProfile={(userToView) => { setFollowModal({ isOpen: false, type: 'followers', users: [], isLoading: false }); onViewProfile(userToView); }}
                isOwnProfile={isOwnProfile}
                listType={followModal.type}
                isLoading={followModal.isLoading}
            />
        )
    }
    <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectCamera={() => {
            if (mediaTarget === 'avatar') avatarCameraRef.current?.click();
            if (mediaTarget === 'banner') bannerCameraRef.current?.click();
        }}
        onSelectGallery={() => {
            if (mediaTarget === 'avatar') avatarInputRef.current?.click();
            if (mediaTarget === 'banner') bannerInputRef.current?.click();
        }}
    />
        </div >
    );
};

const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
const ShareIcon = ({ className = 'h-5 w-5' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
const BlockIcon = ({ className = 'h-5 w-5' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
const FlagIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 22v-7" />
    </svg>
);
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
