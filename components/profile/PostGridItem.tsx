import React from 'react';
import { Post } from '../../types';

interface PostGridItemProps {
  post: Post;
  onClick: () => void;
}

const PostGridItem: React.FC<PostGridItemProps> = ({ post, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative aspect-square bg-surface border border-border rounded-md overflow-hidden cursor-pointer group"
    >
      {post.imageUrl ? (
        <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
      ) : (
        <div className="p-3 text-primary text-xs">
          <p className="line-clamp-6">{post.content}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex items-center space-x-4 text-white">
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">{post.likes.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">{post.comments.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostGridItem;
