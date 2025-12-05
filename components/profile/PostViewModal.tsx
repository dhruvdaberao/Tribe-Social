



// import React from 'react';
// import { Post, User, Tribe } from '../../types';
// import PostCard from '../feed/PostCard';

// interface PostViewModalProps {
//   post: Post;
//   currentUser: User;
//   allUsers: User[];
//   allTribes: Tribe[];
//   onLike: (postId: string) => void;
//   onComment: (postId: string, text: string) => void;
//   onDeletePost: (postId: string) => void;
//   onDeleteComment: (postId: string, commentId: string) => void;
//   onViewProfile: (user: User) => void;
//   onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
//   onClose: () => void;
// }

// const PostViewModal: React.FC<PostViewModalProps> = (props) => {
//   const { post, onClose } = props;

//   return (
//     <div
//       className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//       onClick={onClose}
//     >
//       <button onClick={onClose} className="absolute top-4 left-4 text-white bg-black/30 rounded-full p-2 hover:bg-black/50 transition-colors z-10">
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//         </svg>
//       </button>

//       <div
//         className="bg-transparent w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <PostCard
//           post={post}
//           currentUser={props.currentUser}
//           allUsers={props.allUsers}
//           allTribes={props.allTribes}
//           onLike={props.onLike}
//           onComment={props.onComment}
//           onDeletePost={(postId) => { props.onDeletePost(postId); onClose(); }}
//           onDeleteComment={props.onDeleteComment}
//           onViewProfile={props.onViewProfile}
//           onSharePost={props.onSharePost}
//         />
//       </div>
//     </div>
//   );
// };

// export default PostViewModal;






import React from 'react';
import { Post, User, Tribe } from '../../types';
import PostCard from '../feed/PostCard';

interface PostViewModalProps {
  post: Post;
  currentUser: User;
  allUsers: User[];
  allTribes: Tribe[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onViewProfile: (user: User) => void;
  onSharePost: (post: Post, destination: { type: 'tribe' | 'user', id: string }) => void;
  onClose: () => void;
}

const PostViewModal: React.FC<PostViewModalProps> = (props) => {
  const { post, onClose } = props;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-transparent w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <PostCard
          post={post}
          currentUser={props.currentUser}
          allUsers={props.allUsers}
          allTribes={props.allTribes}
          onLike={props.onLike}
          onComment={props.onComment}
          onDeletePost={(postId) => { props.onDeletePost(postId); onClose(); }}
          onDeleteComment={props.onDeleteComment}
          onViewProfile={props.onViewProfile}
          onSharePost={props.onSharePost}
          onModalClose={onClose}
        />
      </div>
    </div>
  );
};

export default PostViewModal;