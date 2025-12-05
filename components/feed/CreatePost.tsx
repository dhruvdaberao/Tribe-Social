





// import React, { useState, useRef, useEffect } from 'react';
// import { User, Story } from '../../types';
// import UserAvatar from '../common/UserAvatar';

// interface CreatePostProps {
//   currentUser: User;
//   allUsers: User[];
//   myStories: Story[];
//   onAddPost: (content: string, imageUrl?: string) => void;
//   isPosting: boolean;
//   onOpenStoryCreator: () => void;
//   onViewUserStories: (userId: string) => void;
// }

// const CreatePost: React.FC<CreatePostProps> = ({ currentUser, allUsers, myStories, onAddPost, isPosting, onOpenStoryCreator, onViewUserStories }) => {
//   const [content, setContent] = useState('');
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [mentionQuery, setMentionQuery] = useState('');
//   const [showMentions, setShowMentions] = useState(false);

//   const hasStory = myStories.length > 0;

//   const filteredUsers = allUsers.filter(user =>
//     user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
//     user.name.toLowerCase().includes(mentionQuery.toLowerCase())
//   ).slice(0, 5);

//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const text = e.target.value;
//     setContent(text);

//     const match = text.match(/@(\w*)$/);
//     if (match) {
//       setShowMentions(true);
//       setMentionQuery(match[1]);
//     } else {
//       setShowMentions(false);
//     }
//   };

//   const handleMentionSelect = (username: string) => {
//     const newContent = content.replace(/@(\w*)$/, `@${username} `);
//     setContent(newContent);
//     setShowMentions(false);
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };
  
//   const removeImage = () => {
//       setImagePreview(null);
//       if(fileInputRef.current) {
//           fileInputRef.current.value = "";
//       }
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isPosting && (content.trim() || imagePreview)) {
//       onAddPost(content, imagePreview || undefined);
//       setContent('');
//       removeImage();
//     }
//   };

//   return (
//     <div className="bg-surface p-4 rounded-2xl shadow-sm border border-border mb-6 relative overflow-hidden">
//         {isPosting && (
//             <div className="absolute top-0 left-0 right-0 h-1 bg-accent/20 overflow-hidden rounded-t-2xl">
//                 <div className="w-full h-full bg-accent animate-indeterminate-progress"></div>
//                  <style>{`
//                     @keyframes indeterminate-progress {
//                         0% { transform: translateX(-100%); }
//                         100% { transform: translateX(100%); }
//                     }
//                     .animate-indeterminate-progress {
//                         animation: indeterminate-progress 1.5s infinite ease-in-out;
//                     }
//                 `}</style>
//             </div>
//         )}
//       <div className={`flex items-start space-x-4 ${isPosting ? 'opacity-50 pointer-events-none' : ''}`}>
//         <div className="relative flex-shrink-0">
//             <button 
//               onClick={hasStory ? () => onViewUserStories(currentUser.id) : onOpenStoryCreator}
//               className={`w-12 h-12 rounded-full p-0.5 ${hasStory ? 'bg-accent' : 'bg-transparent'}`}
//             >
//               <UserAvatar user={currentUser} className="w-full h-full border-2 border-surface" />
//             </button>
//             <button
//                 onClick={onOpenStoryCreator}
//                 className="absolute -bottom-1 -right-1 bg-accent text-accent-text rounded-full p-0.5 border-2 border-surface hover:bg-accent-hover transition-transform hover:scale-110"
//                 aria-label="Create a new story"
//             >
//                 <PlusIcon />
//             </button>
//         </div>

//         <div className="w-full relative">
//           <form onSubmit={handleSubmit} className="w-full">
//             <textarea
//               value={content}
//               onChange={handleContentChange}
//               placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
//               className="w-full p-2 bg-background border-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none text-primary"
//               rows={3}
//               disabled={isPosting}
//             />
//           </form>

//           {showMentions && filteredUsers.length > 0 && (
//             <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg">
//               {filteredUsers.map(user => (
//                 <div
//                   key={user.id}
//                   className="p-2 flex items-center hover:bg-background cursor-pointer"
//                   onClick={() => handleMentionSelect(user.username)}
//                 >
//                   <UserAvatar user={user} className="w-8 h-8 mr-2" />
//                   <div>
//                     <p className="font-semibold text-sm">{user.name}</p>
//                     <p className="text-xs text-secondary">@{user.username}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
          
//           {imagePreview && (
//             <div className="mt-4 relative">
//               <img src={imagePreview} alt="Image preview" className="rounded-lg w-full max-h-80 object-cover" />
//               <button 
//                 type="button"
//                 onClick={removeImage}
//                 className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 leading-none hover:bg-black/80 transition-colors"
//                 aria-label="Remove image"
//                 disabled={isPosting}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
//               </button>
//             </div>
//           )}

//           <div className="flex justify-between items-center mt-2">
//             <div>
//               <button
//                 type="button"
//                 onClick={() => fileInputRef.current?.click()}
//                 className="text-secondary hover:text-accent p-2 rounded-full transition-colors"
//                 aria-label="Add image"
//                 disabled={isPosting}
//               >
//                 <ImageIcon />
//               </button>
//               <input 
//                 type="file" 
//                 ref={fileInputRef} 
//                 onChange={handleFileChange} 
//                 accept="image/*" 
//                 className="hidden" 
//                 disabled={isPosting}
//               />
//             </div>
//             <button
//               type="submit"
//               onClick={handleSubmit}
//               disabled={(!content.trim() && !imagePreview) || isPosting}
//               className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isPosting ? 'Posting...' : 'Post'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//     </svg>
// );

// const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

// export default CreatePost;







import React, { useState, useRef } from 'react';
import { User, Story } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface CreatePostProps {
  currentUser: User;
  allUsers: User[];
  myStories: Story[];
  onAddPost: (content: string, imageUrl?: string) => void;
  isPosting: boolean;
  onOpenStoryCreator: () => void;
  onViewUserStories: (userId: string) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, allUsers, myStories, onAddPost, isPosting, onOpenStoryCreator, onViewUserStories }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStory = myStories.length > 0;

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    const match = text.match(/@(\w*)$/);
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const newContent = content.replace(/@(\w*)$/, `@${username} `);
    setContent(newContent);
    setShowMentions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPosting && (content.trim() || imagePreview)) {
      onAddPost(content, imagePreview || undefined);
      setContent('');
      setImagePreview(null);
    }
  };

  return (
    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-border mb-6 relative overflow-hidden">
        {isPosting && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-accent/20 overflow-hidden rounded-t-2xl">
                <div className="w-full h-full bg-accent animate-indeterminate-progress"></div>
                 <style>{`
                    @keyframes indeterminate-progress {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-indeterminate-progress {
                        animation: indeterminate-progress 1.5s infinite ease-in-out;
                    }
                `}</style>
            </div>
        )}
      <div className={`flex items-start space-x-4 ${isPosting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="relative flex-shrink-0">
            <button 
              onClick={hasStory ? () => onViewUserStories(currentUser.id) : onOpenStoryCreator}
              className={`w-12 h-12 rounded-full p-0.5 ${hasStory ? 'bg-accent' : 'bg-transparent'}`}
            >
              <UserAvatar user={currentUser} className="w-full h-full border-2 border-surface" />
            </button>
            <button
                onClick={onOpenStoryCreator}
                className="absolute -bottom-1 -right-1 bg-accent text-accent-text rounded-full p-0.5 border-2 border-surface hover:bg-accent-hover transition-transform hover:scale-110"
                aria-label="Create a new story"
            >
                <PlusIcon />
            </button>
        </div>

        <div className="w-full relative">
          <form onSubmit={handleSubmit} className="w-full">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
              className="w-full p-2 bg-background border-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none text-primary"
              rows={imagePreview ? 2 : 3}
              disabled={isPosting}
            />
          </form>

          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="p-2 flex items-center hover:bg-background cursor-pointer"
                  onClick={() => handleMentionSelect(user.username)}
                >
                  <UserAvatar user={user} className="w-8 h-8 mr-2" />
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-secondary">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {imagePreview && (
              <div className="mt-2 relative">
                  <img src={imagePreview} alt="Selected preview" className="rounded-lg max-h-48 w-auto" />
                  <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                      <CloseIcon />
                  </button>
              </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-secondary hover:text-accent p-2 rounded-full transition-colors"
                aria-label="Add image"
                disabled={isPosting}
              >
                <ImageIcon />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
                disabled={isPosting}
              />
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imagePreview) || isPosting}
              className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default CreatePost;
