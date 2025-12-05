
import React, { useState, useEffect, useRef } from 'react';
import type { Story, User, Tribe } from '../../types';
import UserAvatar from '../common/UserAvatar';
import ShareModal from '../common/ShareModal';

interface StoryViewerProps {
  userStories: { user: User, stories: Story[] };
  currentUser: User;
  allUsers: User[];
  allTribes: Tribe[];
  onClose: () => void;
  onDelete: (storyId: string) => void;
  onLike: (storyId: string) => void;
  onSharePost: (post: any, destination: { type: 'tribe' | 'user', id: string }) => void; // Re-using for stories
}

const StoryViewer: React.FC<StoryViewerProps> = ({ userStories, currentUser, allUsers, allTribes, onClose, onDelete, onLike, onSharePost }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { user, stories } = userStories;
  const currentStory = stories[currentIndex];

  const goToNext = () => {
    setCurrentIndex(prev => {
      if (prev < stories.length - 1) {
        return prev + 1;
      }
      onClose(); // Close after the last story
      return prev;
    });
  };

  const goToPrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (progressRef.current) {
      // Restart animation logic specifically for current slide
      progressRef.current.getAnimations().forEach(anim => {
          if(isPaused) anim.pause();
          else anim.play();
      });
    }
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (!isPaused) {
      timerRef.current = setTimeout(goToNext, 3000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, stories.length]);

  if (!currentStory) return null;

  const isOwnStory = user.id === currentUser.id;
  const isLiked = currentStory.likes.includes(currentUser.id);

  const handleShare = (destination: { type: 'tribe' | 'user', id: string }) => {
      const storyAsPost = {
          author: user,
          content: currentStory.text || `Check out this story from @${user.username}!`,
          imageUrl: currentStory.imageUrl,
      };
      onSharePost(storyAsPost, destination);
  };


  return (
    <>
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center" 
        onMouseDown={() => setIsPaused(true)} 
        onMouseUp={() => setIsPaused(false)} 
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="relative w-full max-w-md h-full max-h-[95vh] bg-black rounded-2xl shadow-lg overflow-hidden flex flex-col">
          {/* Progress Bars */}
          <div className="absolute top-2 left-2 right-2 flex space-x-1 z-30">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                {index < currentIndex && <div className="h-full w-full bg-white" />}
                {index === currentIndex && (
                  <div 
                    ref={progressRef}
                    className="h-full bg-white animate-progress origin-left"
                    style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2 drop-shadow-md">
              <UserAvatar user={user} className="w-10 h-10 border-2 border-white" />
              <span className="font-bold text-sm shadow-black">{user.name}</span>
            </div>
            <button onClick={(e) => {e.stopPropagation(); onClose();}} className="p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"><CloseIcon /></button>
          </div>

          {/* Navigation Tap Areas */}
          <div onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="absolute left-0 top-0 bottom-20 w-1/3 z-20" />
          <div onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-0 top-0 bottom-20 w-1/3 z-20" />

          {/* Story Content */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            style={{ 
                backgroundColor: currentStory.backgroundColor || '#000',
            }}
          >
            {currentStory.imageUrl ? (
              <>
                <img src={currentStory.imageUrl} alt="Story content" className="w-full h-full object-contain pointer-events-none" />
                {currentStory.text && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/20">
                        <p 
                            className="text-center font-bold text-2xl md:text-3xl"
                            style={{ 
                                color: currentStory.textColor || '#fff',
                                textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                            }}
                        >
                            {currentStory.text}
                        </p>
                    </div>
                )}
              </>
            ) : (
              // Text Only Mode
              <div className="p-8 text-center break-words max-w-full">
                 <p 
                    className="font-bold text-2xl md:text-4xl"
                    style={{ 
                        color: currentStory.textColor || '#fff',
                    }}
                 >
                    {currentStory.text}
                 </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30 flex items-center justify-end space-x-3 bg-gradient-to-t from-black/80 to-transparent">
              {!isOwnStory && (
                  <button 
                    onClick={(e) => {e.stopPropagation(); onLike(currentStory.id);}} 
                    className={`p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 ${isLiked ? 'text-red-500' : 'text-white'}`}
                  >
                      <HeartIcon filled={isLiked} />
                  </button>
              )}
              <button onClick={(e) => {e.stopPropagation(); setIsShareModalOpen(true);}} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 text-white"><ShareIcon /></button>
              {isOwnStory && (
                  <button onClick={(e) => {e.stopPropagation(); onDelete(currentStory.id);}} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 text-white"><TrashIcon /></button>
              )}
          </div>

        </div>
        <style>{`.animate-progress { animation: progress 3s linear forwards; } @keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
      {isShareModalOpen && (
          <ShareModal
              post={{ author: user, content: currentStory.text || '', imageUrl: currentStory.imageUrl } as any}
              currentUser={currentUser}
              users={allUsers}
              tribes={allTribes}
              onClose={() => setIsShareModalOpen(false)}
              onSharePost={(post, dest) => handleShare(dest)}
          />
      )}
    </>
  );
};

// --- ICONS ---
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const HeartIcon = ({ filled }: { filled: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

export default StoryViewer;
