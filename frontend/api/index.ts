

import axios from 'axios';
import axiosRetry from 'axios-retry';
import { toast } from '../components/common/Toast';

const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5001'
  : 'https://tribe-social-backend.onrender.com';

const API_TIMEOUT_MS = 60000; // 60 seconds for Render cold starts

const API = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: API_TIMEOUT_MS,
});

const isPublicEndpoint = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/verify-otp');
};

const handleUnauthorizedSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.href = '/';
  }
};

// Retry failed requests 3 times with exponential delay
axiosRetry(API, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ? error.response.status >= 500 : false);
  }
});

API.interceptors.request.use(req => {
  const rawToken = localStorage.getItem('token');
  if (rawToken) {
    const token = rawToken.replace(/"/g, '').trim(); // Sanitized
    req.headers.Authorization = `Bearer ${token}`;
    return req;
  }

  if (!isPublicEndpoint(req.url)) {
    handleUnauthorizedSession();
    return Promise.reject(new Error('Missing auth token'));
  }

  return req;
});

const DISABLED_MESSAGE = 'Your account has been disabled by the Admin';
let disabledLogoutTriggered = false;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop: Don't redirect if 401 happens on login page or during login request
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 403 && error.response?.data?.message?.includes('disabled by the Admin')) {
      if (!disabledLogoutTriggered) {
        disabledLogoutTriggered = true;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        toast.error(DISABLED_MESSAGE);
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    if (error.response && error.response.status === 401 && !isLoginRequest && !isPublicEndpoint(error.config?.url)) {
      handleUnauthorizedSession();
    }
    return Promise.reject(error);
  }
);

/* ───────────── HELPERS (NORMALIZATION) ───────────── */
const normalizeId = <T extends { _id?: string }>(obj: T) => {
  if (!obj) return obj as any;
  const { _id, ...rest } = obj as any;

  const normalized: any = {
    id: _id?.toString(),
    ...rest,
    // Safely default array fields
    followers: Array.isArray(rest.followers) ? rest.followers : [],
    following: Array.isArray(rest.following) ? rest.following : [],
    blockedUsers: Array.isArray(rest.blockedUsers) ? rest.blockedUsers : [],
    likes: Array.isArray(rest.likes) ? rest.likes : [],
  };

  if (normalized.owner) {
    normalized.owner = normalized.owner.toString();
  }

  if (Array.isArray(normalized.members)) {
    normalized.members = normalized.members.map((m: any) =>
      typeof m === 'object' && m._id ? m._id.toString() : m.toString()
    );
  }

  return normalized;
};

const normalizeArray = <T extends { _id?: string }>(arr: T[]) =>
  arr.map(normalizeId);


/* ───────────── AUTH ───────────── */
export const login = (formData: any) => API.post('/auth/login', formData);
export const register = (formData: any) => API.post('/auth/register', formData);
export const forgotPassword = (email: string) => API.post('/auth/forgot-password', { email });
export const verifyOtp = (email: string, otp: string) => API.post('/auth/verify-otp', { email, otp });

/* ───────────── USERS ───────────── */
export const fetchUsers = async () => {
  const res = await API.get('/users');
  return { data: normalizeArray(res.data) };
};

export const fetchUser = async (id: string) => {
  const res = await API.get(`/users/${id}`);
  return { data: normalizeId(res.data) };
};

export const fetchUserFollowers = async (id: string) => {
  const res = await API.get(`/users/${id}/followers`);
  return { data: normalizeArray(res.data) };
};

export const fetchUserFollowing = async (id: string) => {
  const res = await API.get(`/users/${id}/following`);
  return { data: normalizeArray(res.data) };
};

export const updateProfile = (profileData: any) =>
  API.put('/users/profile', profileData);

export const toggleFollow = (id: string) =>
  API.put(`/users/${id}/follow`);

export const removeFollower = (id: string) =>
  API.put(`/users/${id}/remove-follower`);

export const toggleBlock = (id: string) =>
  API.put(`/users/${id}/block`);

export const blockUser = (blockedUserId: string) =>
  API.post('/users/block-user', { blockedUserId });

export const deleteAccount = () =>
  API.delete('/users/profile');

/* ───────────── POSTS ───────────── */
export const fetchPost = async (id: string) => {
  const res = await API.get(`/posts/${id}`);
  return { data: normalizeId(res.data) };
};

export const fetchPosts = async (page = 1, limit = 50) => {
  const res = await API.get(`/posts?page=${page}&limit=${limit}`);
  return { data: normalizeArray(res.data) };
};

export const fetchFeedPosts = async (page = 1, limit = 20) => {
  const res = await API.get(`/posts/feed?page=${page}&limit=${limit}`);
  return { data: normalizeArray(res.data) };
};

export const fetchUserPosts = async (userId: string) => {
  const res = await API.get(`/posts/user/${userId}`);
  return { data: normalizeArray(res.data) };
};

export const createPost = (newPost: any) =>
  API.post('/posts', newPost);

export const deletePost = (id: string) =>
  API.delete(`/posts/${id}`);

export const hidePost = (id: string) =>
  API.patch(`/posts/${id}/hide`);

export const unhidePost = (id: string) =>
  API.patch(`/posts/${id}/unhide`);

export const likePost = (id: string) =>
  API.put(`/posts/${id}/like`);

// Stories
export const createStory = (storyData: any) => API.post('/stories', storyData);

export const fetchMyStories = async () => {
  const res = await API.get('/stories/my-stories');
  return { data: normalizeArray(res.data) };
};

export const fetchFollowingStories = async () => {
  const res = await API.get('/stories/feed');
  return { data: normalizeArray(res.data) };
};

export const fetchUserStories = async (userId: string) => {
  const res = await API.get(`/stories/user/${userId}`);
  return { data: normalizeArray(res.data) };
};

export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
export const likeStory = (id: string) => API.put(`/stories/${id}/like`);

export const commentOnPost = (id: string, commentData: any) =>
  API.post(`/posts/${id}/comments`, commentData);

export const deleteComment = (postId: string, commentId: string) =>
  API.delete(`/posts/${postId}/comments/${commentId}`);

/* ───────────── DIRECT MESSAGES ───────────── */
export const fetchConversations = async () => {
  const res = await API.get('/messages/conversations');
  return { data: normalizeArray(res.data) };
};

export const fetchMessages = async (otherUserId: string, params?: { limit?: number; before?: string }) => {
  const res = await API.get(`/messages/${otherUserId}`, { params });
  return { data: normalizeArray(res.data) };
};

export const sendMessage = (receiverId: string, messageData: any, config?: { onUploadProgress?: (event: any) => void }) =>
  API.post(`/messages/send/${receiverId}`, messageData, config);

export const deleteMessage = (messageId: string) =>
  API.delete(`/messages/${messageId}`);

export const deleteMessageForMe = (messageId: string) =>
  API.put(`/messages/${messageId}/delete-for-me`);

export const clearConversation = (otherUserId: string) =>
  API.put(`/messages/clear/${otherUserId}`);

/* ───────────── TRIBES ───────────── */
export const fetchTribes = async () => {
  const res = await API.get('/tribes');
  return { data: normalizeArray(res.data) };
};


export const fetchTribe = async (id: string) => {
  const res = await API.get(`/tribes/${id}`);
  return { data: normalizeId(res.data) };
};


export const createTribe = async (tribeData: any) => {
  const res = await API.post('/tribes', tribeData);
  return { data: normalizeId(res.data) };
};

export const updateTribe = async (id: string, tribeData: any) => {
  const res = await API.put(`/tribes/${id}`, tribeData);
  return { data: normalizeId(res.data) };
};

export const deleteTribe = (id: string) =>
  API.delete(`/tribes/${id}`);

export const joinTribe = async (id: string) => {
  const res = await API.put(`/tribes/${id}/join`);
  return { data: normalizeId(res.data) };
};

export const kickTribeMember = async (tribeId: string, userId: string) => {
  const res = await API.put(`/tribes/${tribeId}/kick/${userId}`);
  return { data: normalizeId(res.data) };
};

export const requestJoinTribe = async (id: string) => {
  const res = await API.post(`/tribes/${id}/request`);
  return { data: normalizeId(res.data) };
};

export const acceptTribeRequest = async (tribeId: string, userId: string) => {
  const res = await API.post(`/tribes/${tribeId}/accept/${userId}`);
  return { data: normalizeId(res.data) };
};


export const fetchTribeMessages = async (id: string, params?: { limit?: number; before?: string }) => {
  const res = await API.get(`/tribes/${id}/messages`, { params });
  return {
    data: res.data.map((m: any) => ({
      id: m._id || m.id,
      tribeId: id,
      sender: m.sender,
      senderId: m.sender?._id || m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      imageUrl: m.imageUrl,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      attachmentName: m.attachmentName,
      attachmentSize: m.attachmentSize,
      isSystem: m.isSystem || false,
      systemAction: m.systemAction || null,
      actionTargetId: m.actionTargetId || null,
    })),
  };
};

export const sendTribeMessage = async (id: string, messageData: any, config?: { onUploadProgress?: (event: any) => void }) => {
  const res = await API.post(`/tribes/${id}/messages`, messageData, config);
  return {
    data: {
      id: res.data._id || res.data.id,
      tribeId: id,
      sender: res.data.sender,
      senderId: res.data.sender?._id,
      text: res.data.text,
      timestamp: res.data.timestamp,
      imageUrl: res.data.imageUrl,
      attachmentUrl: res.data.attachmentUrl,
      attachmentType: res.data.attachmentType,
      attachmentName: res.data.attachmentName,
      attachmentSize: res.data.attachmentSize,
      isSystem: res.data.isSystem || false,
      systemAction: res.data.systemAction || null,
      actionTargetId: res.data.actionTargetId || null,
    },
  };
};

export const deleteTribeMessage = (tribeId: string, messageId: string) =>
  API.delete(`/tribes/${tribeId}/messages/${messageId}`);

export const deleteTribeMessageForMe = (tribeId: string, messageId: string) =>
  API.put(`/tribes/${tribeId}/messages/${messageId}/delete-for-me`);

/* ───────────── AI CHAT ───────────── */
export const generateAiChat = (promptData: { prompt: string }) =>
  API.post('/ai/chat', promptData);

/* ───────────── NOTIFICATIONS ───────────── */
export const saveFcmToken = (token: string) =>
  API.post('/notifications/save-token', { token });

export const fetchNotifications = async () => {
  const res = await API.get('/notifications');
  return { data: normalizeArray(res.data) };
};

export const markNotificationsRead = () =>
  API.put('/notifications/read');

export const updateNotificationPrefs = async (notificationPrefs: any) => {
  const res = await API.post('/notifications/preferences', { notificationPrefs });
  return { data: res.data };
};

export const updatePushSettings = (settings: { pushNotifications?: boolean; pushPrefs?: any }) =>
  API.patch('/users/notification-settings', settings);


/* ───────────── MODERATION ───────────── */
export const createReport = (payload: {
  targetType: 'post' | 'user' | 'tribe';
  targetId: string;
  reason: string;
  details?: string;
  escalatedToSuperAdmin?: boolean;
}) =>
  API.post('/reports', payload);

export const fetchReports = (params: Record<string, any>) =>
  API.get('/reports', { params });

export const updateReportStatus = (id: string, status: string) =>
  API.patch(`/reports/${id}`, { status });

export const applyModerationAction = (payload: {
  targetType: 'post' | 'user' | 'tribe';
  targetId: string;
  actionType: string;
  reason?: string;
  message?: string;
}) => API.post('/moderation/action', payload);

export const fetchModerationPosts = (params: Record<string, any>) =>
  API.get('/moderation/posts', { params });

export const fetchModerationUsers = (params: Record<string, any>) =>
  API.get('/moderation/users', { params });

export const updateUserRole = (userId: string, payload: { isAdmin?: boolean; isSuperAdmin?: boolean }) =>
  API.patch(`/moderation/users/${userId}/role`, payload);

export const fetchModerationTribes = (params: Record<string, any>) =>
  API.get('/moderation/tribes', { params });

export const reportPost = (postId: string, reason = 'Other', details = '') =>
  createReport({ targetType: 'post', targetId: postId, reason, details });

export const reportUser = (targetUserId: string, reason = 'Other', details = '') =>
  createReport({ targetType: 'user', targetId: targetUserId, reason, details });

export const reportTribe = (tribeId: string, reason = 'Other', details = '') =>
  createReport({ targetType: 'tribe', targetId: tribeId, reason, details });
