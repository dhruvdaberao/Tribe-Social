





// export interface User {
//   id: string;
//   name: string;
//   username: string;
//   avatarUrl: string | null;
//   bannerUrl: string | null;
//   bio: string;
//   followers: string[]; // Array of user IDs
//   following: string[]; // Array of user IDs
//   blockedUsers: string[]; // Array of user IDs
// }

// export interface Comment {
//   id: string;
//   author: User;
//   text: string;
//   timestamp: string;
// }

// export interface Post {
//   id:string;
//   author: User;
//   content: string;
//   imageUrl?: string;
//   timestamp: string;
//   likes: string[]; // Array of user IDs
//   comments: Comment[];
// }

// export interface Message {
//   id: string;
//   senderId: string;
//   receiverId: string;
//   text: string;
//   timestamp: string;
//   imageUrl?: string;
// }

// export interface Conversation {
//   id: string;
//   participants: { id: string }[]; // Just participant IDs
//   messages: Message[];
//   lastMessage: string;
//   timestamp: string;
// }

// export interface TribeMessage {
//   id: string;
//   tribeId?: string; // Added for socket events
//   sender: User;
//   senderId?: string; // Added for socket events
//   text: string;
//   timestamp: string;
//   imageUrl?: string;
// }

// export interface Tribe {
//   id: string;
//   name: string;
//   avatarUrl: string | null;
//   description: string;
//   owner: string; // User ID
//   members: string[]; // Array of user IDs
//   messages: TribeMessage[];
// }

// export interface Notification {
//   id: string;
//   recipient: string; // User ID
//   sender: User;
//   type: 'like' | 'comment' | 'follow' | 'message' | 'story_like';
//   read: boolean;
//   postId?: string; // ID of the post that was liked/commented on
//   storyId?: string; // ID of the story that was liked
//   commentId?: string;
//   timestamp: string;
// }

// export interface Story {
//   id: string;
//   author: User; 
//   user: string; // User ID
//   imageUrl?: string;
//   text?: string;
//   textPosition?: { x: number; y: number };
//   imagePosition?: { x: number; y: number };
//   likes: string[]; // Array of user IDs
//   createdAt: string;
// }




export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  blockedUsers: string[]; // Array of user IDs
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id:string;
  author: User;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  participants: { id: string }[]; // Just participant IDs
  messages: Message[];
  lastMessage: string;
  timestamp: string;
}

export interface TribeMessage {
  id: string;
  tribeId?: string; // Added for socket events
  sender: User;
  senderId?: string; // Added for socket events
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export interface Tribe {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string;
  owner: string; // User ID
  members: string[]; // Array of user IDs
  messages: TribeMessage[];
}

export interface Notification {
  id: string;
  recipient: string; // User ID
  sender: User;
  type: 'like' | 'comment' | 'follow' | 'message' | 'story_like' | 'tribe_join';
  read: boolean;
  postId?: string; // ID of the post that was liked/commented on
  storyId?: string; // ID of the story that was liked
  tribeId?: string; // ID of the tribe that was joined
  commentId?: string;
  timestamp: string;
}

export interface Story {
  id: string;
  author: User; 
  user: string; // User ID
  imageUrl?: string;
  text?: string;
  textPosition?: { x: number; y: number };
  imagePosition?: { x: number; y: number };
  likes: string[]; // Array of user IDs
  createdAt: string;
}