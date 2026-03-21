import React from 'react';
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
  onReport: (targetId: string, targetType: 'post' | 'user' | 'tribe' | 'comment' | 'story', targetName: string) => void;
}

const FeedPage: React.FC<FeedPageProps> = (props) => {
  const { posts, currentUser, allUsers, allTribes, onLikePost, onCommentPost, onDeletePost, onDeleteComment, onViewProfile, onSharePost, onReport } = props;
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary font-display">Home Feed</h1>
        <p className="text-sm text-secondary">Updates from your community, stories, and conversations in one place.</p>
      </div>
      <div className="space-y-5">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface px-6 py-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-primary">Your feed is quiet right now</h2>
            <p className="mt-2 text-sm text-secondary">Follow more people or create your first post to bring this space to life.</p>
          </div>
        ) : (
          posts.map(post => (
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
              onReport={onReport}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FeedPage;
