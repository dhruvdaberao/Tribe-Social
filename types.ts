

/* ===================== USER ===================== */
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  followers: string[];
  following: string[];
  blockedUsers: string[];
}

/* ===================== COMMENTS & POSTS ===================== */
export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: string[];
  comments: Comment[];
}

/* ===================== DIRECT MESSAGES ===================== */
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
  participants: { id: string }[];
  messages: Message[];
  lastMessage: string;
  timestamp: string;
}

/* ===================== TRIBES ===================== */
/**
 * IMPORTANT:
 * - Frontend uses `id`
 * - Backend `_id` MUST be normalized in API layer
 * - Tribe NEVER contains messages
 */
export interface Tribe {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string | null;
  owner: string;
  members: string[];
  createdAt?: string;
  messages?: TribeMessage[];
}

/* ===================== TRIBE MESSAGES ===================== */
/**
 * Tribe messages live ONLY in TribeDetailPage state
 */
export interface TribeMessage {
  id: string;          // 🔥 FRONTEND ID (normalized from _id)
  tribeId: string;
  sender: User;
  senderId: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

/* ===================== NOTIFICATIONS ===================== */
export interface Notification {
  id: string;
  recipient: string;
  sender: User;
  type:
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'story_like'
  | 'tribe_join';
  read: boolean;
  postId?: string;
  storyId?: string;
  tribeId?: string;
  commentId?: string;
  timestamp: string;
}

/* ===================== STORIES ===================== */
export interface Story {
  id: string;
  author: User;
  user: string;
  imageUrl?: string;
  text?: string;
  textPosition?: { x: number; y: number };
  imagePosition?: { x: number; y: number };
  textRotation?: number;
  imageRotation?: number;
  textScale?: number;
  imageScale?: number;
  textColor?: string;
  backgroundColor?: string;
  likes: string[];
  createdAt: string;
}
