









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
import React, { useState, useRef } from 'react';
import { Post, User, Tribe, Story } from '../../types';
import type { NavItem } from '../../App';
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';
import FollowListModal from './FollowListModal';
import UserAvatar from '../common/UserAvatar';
import ShareButton from '../common/ShareButton';
import PostGridItem from './PostGridItem';
import PostViewModal from './PostViewModal';

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
  onDeleteComment: (postId: string, commentId: string) => void;
  onViewProfile: (user: User) => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onAddPost: (content: string, imageUrl?: string) => void;
  isPosting: boolean;
  onToggleFollow: (targetUserId: string) => void;
  onStartConversation: (user: User) => void;
  onNavigate: (item: NavItem) => void;
  onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
  onOpenStoryCreator: () => void;
  myStories: Story[];
  onViewUserStories: (userId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = (props) => {
    const { 
        user, allUsers, visibleUsers, allTribes, posts, currentUser, hasStory,
        onLikePost, onCommentPost, onDeletePost, onDeleteComment, 
        onViewProfile, onUpdateUser, onAddPost, isPosting, onToggleFollow, 
        onStartConversation, onNavigate, onSharePost, onOpenStoryCreator,
        myStories, onViewUserStories
    } = props;
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [followModal, setFollowModal] = useState<{isOpen: boolean, type: 'followers' | 'following', userIds: string[]}>({isOpen: false, type: 'followers', userIds: []});
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [viewingPost, setViewingPost] = useState<Post | null>(null);


  const isOwnProfile = user.id === currentUser.id;
  const isFollowing = (currentUser.following || []).includes(user.id);
  
  const openFollowModal = (type: 'followers' | 'following', userIds: string[]) => {
    setFollowModal({isOpen: true, type, userIds});
  }

  const handleMessageClick = () => {
      onStartConversation(user);
  }

  return (
    <div>
      <div className="bg-surface rounded-2xl shadow-sm border border-border mb-6 overflow-hidden">
        <div className="h-48 md:h-64 bg-background rounded-t-2xl">
            {user.bannerUrl ? <img src={user.bannerUrl} alt={`${user.name}'s banner`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-background via-surface to-background" />}
        </div>
        
        <div className="p-4 md:p-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start">
                <div 
                  className="sm:-mt-20 -mt-16 flex-shrink-0 cursor-pointer"
                  onClick={hasStory ? () => onViewUserStories(user.id) : undefined}
                >
                  <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full p-1 ${hasStory ? 'bg-accent' : 'bg-transparent'}`}>
                    <UserAvatar user={user} className="w-full h-full border-4 border-surface" />
                  </div>
                </div>
                
                <div className="w-full sm:w-auto pt-2 sm:pt-4 flex items-center space-x-2">
                    {isOwnProfile ? (
                        <>
                            <button onClick={() => onNavigate('Settings')} className="w-full sm:w-auto font-semibold px-4 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background flex items-center space-x-2">
                                <span>Settings</span>
                                <SettingsIcon />
                            </button>
                            <button onClick={() => setEditModalOpen(true)} className="w-full sm:w-auto bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors">
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <>
                           <button onClick={handleMessageClick} className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg transition-colors bg-surface text-primary border border-border hover:bg-background">Message</button>
                           <button onClick={() => onToggleFollow(user.id)} className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-lg transition-colors ${ isFollowing ? 'bg-surface text-primary border border-border hover:bg-background' : 'bg-accent text-accent-text hover:bg-accent-hover' }`}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                           <div className="relative">
                               <button onClick={() => setOptionsOpen(!optionsOpen)} onBlur={() => setTimeout(() => setOptionsOpen(false), 150)} className="p-2 rounded-full bg-surface text-primary border border-border hover:bg-background" aria-label="More options"><OptionsIcon /></button>
                                {optionsOpen && (
                                     <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border z-10">
                                         <ShareButton shareData={{ title: `Check out ${user.name}'s profile on Tribe!`, text: `See what ${user.name} (@${user.username}) is up to.`, url: window.location.href }} className="w-full text-left px-4 py-2 text-primary hover:bg-background rounded-t-lg transition-colors flex items-center space-x-2" onShare={() => setOptionsOpen(false)}>
                                             <ShareIcon /><span>Share Profile</span>
                                         </ShareButton>
                                         <button onClick={() => onStartConversation(user)} className={`w-full text-left px-4 py-2 hover:bg-background transition-colors flex items-center space-x-2 text-primary`}>
                                            <BlockIcon /><span>Block User</span>
                                         </button>
                                     </div>
                                )}
                           </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-2">
              <h1 className="text-3xl font-bold text-primary font-display">{user.name}</h1>
              <p className="text-md text-secondary">@{user.username}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <button onClick={() => openFollowModal('following', user.following || [])} className="hover:underline"><span className="font-bold text-primary">{(user.following || []).length}</span> <span className="text-secondary">Following</span></button>
                  <button onClick={() => openFollowModal('followers', user.followers || [])} className="hover:underline"><span className="font-bold text-primary">{(user.followers || []).length}</span> <span className="text-secondary">Followers</span></button>
              </div>
              <p className="text-primary mt-4 max-w-2xl whitespace-pre-wrap">{user.bio}</p>
            </div>
        </div>
      </div>
      
      {isOwnProfile && <CreatePost currentUser={currentUser} allUsers={visibleUsers} myStories={myStories} onAddPost={onAddPost} isPosting={isPosting} onOpenStoryCreator={onOpenStoryCreator} onViewUserStories={onViewUserStories} />}

      <h2 className="text-xl font-bold text-primary my-6 font-display">{isOwnProfile ? "Your Posts" : `${user.name.split(' ')[0]}'s Posts`}</h2>
      
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map(post => (
                <PostGridItem key={post.id} post={post} onClick={() => setViewingPost(post)} />
            ))}
        </div>
      ) : (
        <div className="bg-surface p-8 text-center rounded-2xl border border-border">
            <p className="text-secondary">No posts yet.</p>
        </div>
      )}
      
      {viewingPost && (
          <PostViewModal
            post={viewingPost}
            currentUser={currentUser}
            allUsers={visibleUsers}
            allTribes={allTribes}
            onLike={onLikePost}
            onComment={onCommentPost}
            onDeletePost={onDeletePost}
            onDeleteComment={onDeleteComment}
            onViewProfile={(userToView) => { setViewingPost(null); onViewProfile(userToView); }}
            onSharePost={onSharePost}
            onClose={() => setViewingPost(null)}
          />
      )}

      {isOwnProfile && isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setEditModalOpen(false)} onSave={onUpdateUser} />}
      
      {followModal.isOpen && (
        <FollowListModal title={followModal.type === 'followers' ? 'Followers' : 'Following'} userIds={followModal.userIds} allUsers={allUsers} currentUser={currentUser} onClose={() => setFollowModal({isOpen: false, type: 'followers', userIds: []})} onToggleFollow={onToggleFollow} onViewProfile={(userToView) => { setFollowModal({isOpen: false, type: 'followers', userIds: []}); onViewProfile(userToView); }} />
      )}
    </div>
  );
};

// Edit Profile Modal
interface EditProfileModalProps { user: User; onClose: () => void; onSave: (updatedUser: Partial<User>) => void; }
const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: user.name, username: user.username, bio: user.bio });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
    const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerUrl);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'avatar') setAvatarPreview(reader.result as string);
                if (type === 'banner') setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, avatarUrl: avatarPreview, bannerUrl: bannerPreview });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-border">
                <div className="p-4 flex justify-between items-center border-b border-border"><h2 className="text-xl font-bold text-primary">Edit Profile</h2><button onClick={onClose} className="text-secondary hover:text-primary">&times;</button></div>
                <div className="overflow-y-auto">
                    <div className="relative">
                        <div className="h-40 bg-background">{bannerPreview ? <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-background via-surface to-background" />}</div>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><button onClick={() => bannerInputRef.current?.click()} className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70"><CameraIcon /></button><input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" /></div>
                        <div className="absolute bottom-0 left-4 translate-y-1/2">
                            <div className="w-24 h-24 rounded-full border-4 border-surface bg-surface relative">
                                <UserAvatar user={{...user, avatarUrl: avatarPreview}} className="w-full h-full" />
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><button onClick={() => avatarInputRef.current?.click()} className="bg-black/50 text-white rounded-full p-2"><CameraIcon /></button><input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" /></div>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 pt-16"><div className="space-y-4">
                        <div><label className="text-sm font-semibold text-secondary">Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border border-border rounded-lg" /></div>
                        <div><label className="text-sm font-semibold text-secondary">Username</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full mt-1 p-2 bg-background border border-border rounded-lg" /></div>
                        <div><label className="text-sm font-semibold text-secondary">Bio</label><textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2 bg-background border border-border rounded-lg resize-none" /></div>
                    </div></form>
                </div>
                <div className="p-4 flex justify-end items-center border-t border-border mt-auto"><button onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button><button onClick={handleSubmit} className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover">Save</button></div>
            </div>
        </div>
    );
};

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
const BlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;