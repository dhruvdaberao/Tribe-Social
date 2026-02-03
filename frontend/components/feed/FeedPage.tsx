import React, { useEffect, useRef } from 'react';
import { Post, User, Tribe } from '../../types';
import PostCard from './PostCard';

interface FeedPageProps {
  posts: Post[];
  currentUser: User;
  allUsers: User[];
  allTribes: Tribe[];
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onViewProfile: (user: User) => void;
  onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
  onVisitDiscover: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const FeedPage: React.FC<FeedPageProps> = (props) => {
  const { posts, currentUser, allUsers, allTribes, onLikePost, onCommentPost, onDeletePost, onDeleteComment, onViewProfile, onSharePost, onVisitDiscover, onLoadMore, hasMore } = props;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-trigger load more when scrolling to bottom
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMore, onLoadMore]);
  return (
    <div>
      <h1 className="text-[28px] font-bold text-primary mb-6 font-display leading-[1.2]">Home Feed</h1>
      <div className="space-y-6">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            allUsers={allUsers}
            allTribes={allTribes}
            onLike={onLikePost}
            onComment={onCommentPost}
            onDeletePost={onDeletePost}
            onDeleteComment={onDeleteComment}
            onViewProfile={onViewProfile}
            onSharePost={onSharePost}
          />
        ))}
      </div>

      {hasMore ? (
        <div ref={observerTarget} className="py-8 flex justify-center w-full">
          <img src="/duckload.gif" alt="Loading..." className="w-12 h-12 opacity-50" />
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2 font-display">All caught up!</h3>
            <p className="text-secondary mb-6 leading-relaxed">
              Follow more users to see their posts on your home feed.
            </p>
            <button
              onClick={onVisitDiscover}
              className="w-full bg-accent hover:bg-accent/90 text-accent-text font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
            >
              <span>Browse Discovery</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;