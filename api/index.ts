

import axios from 'axios';

const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5001'
  : 'https://tribe-social-backend.onrender.com';

const API = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000, // 60 seconds for Render cold starts
});

API.interceptors.request.use(req => {
  const rawToken = localStorage.getItem('token');
  if (rawToken) {
    const token = rawToken.replace(/"/g, '').trim(); // Sanitized
    req.headers.Authorization = `Bearer ${token}`;
    console.log("🔐 Attaching Auth Token:", `${token.substring(0, 10)}... (Length: ${token.length})`);
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop: Don't redirect if 401 happens on login page or during login request
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isLoginRequest) {
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // Prevent aggressive redirects. Let the UI handle the "logged out" state naturally (e.g., via App.tsx)
      // if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      //   window.location.href = '/';
      // }
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

export const updateProfile = (profileData: any) =>
  API.put('/users/profile', profileData);

export const toggleFollow = (id: string) =>
  API.put(`/users/${id}/follow`);

export const toggleBlock = (id: string) =>
  API.put(`/users/${id}/block`);

export const deleteAccount = () =>
  API.delete('/users/profile');

/* ───────────── POSTS ───────────── */
export const fetchPost = async (id: string) => {
  const res = await API.get(`/posts/${id}`);
  return { data: normalizeId(res.data) };
};

export const fetchPosts = async () => {
  const res = await API.get('/posts');
  return { data: normalizeArray(res.data) };
};

export const fetchFeedPosts = async () => {
  const res = await API.get('/posts/feed');
  return { data: normalizeArray(res.data) };
};

export const createPost = (newPost: any) =>
  API.post('/posts', newPost);

export const deletePost = (id: string) =>
  API.delete(`/posts/${id}`);

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

export const fetchMessages = async (otherUserId: string) => {
  const res = await API.get(`/messages/${otherUserId}`);
  return { data: normalizeArray(res.data) };
};

export const sendMessage = (receiverId: string, messageData: any) =>
  API.post(`/messages/send/${receiverId}`, messageData);

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


export const fetchTribeMessages = async (id: string) => {
  const res = await API.get(`/tribes/${id}/messages`);
  return {
    data: res.data.map((m: any) => ({
      id: m._id,
      tribeId: id,
      sender: m.sender,
      senderId: m.sender?._id || m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      imageUrl: m.imageUrl,
    })),
  };
};

export const sendTribeMessage = async (id: string, messageData: any) => {
  const res = await API.post(`/tribes/${id}/messages`, messageData);
  return {
    data: {
      id: res.data._id,
      tribeId: id,
      sender: res.data.sender,
      senderId: res.data.sender?._id,
      text: res.data.text,
      timestamp: res.data.timestamp,
      imageUrl: res.data.imageUrl,
    },
  };
};

export const deleteTribeMessage = (tribeId: string, messageId: string) =>
  API.delete(`/tribes/${tribeId}/messages/${messageId}`);

/* ───────────── AI CHAT ───────────── */
export const generateAiChat = (promptData: { prompt: string }) =>
  API.post('/ai/chat', promptData);

/* ───────────── NOTIFICATIONS ───────────── */
export const fetchNotifications = async () => {
  const res = await API.get('/notifications');
  return { data: normalizeArray(res.data) };
};

export const markNotificationsRead = () =>
  API.put('/notifications/read');
