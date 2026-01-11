// import axios from 'axios';

// // Backend URL
// const API_URL = 'https://tribe-social-backend.onrender.com';

// // Axios instance
// const API = axios.create({
//   baseURL: `${API_URL}/api`,
// });

// // Attach auth token automatically
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// /* ───────────── AUTH ───────────── */
// export const login = (formData: any) => API.post('/auth/login', formData);
// export const register = (formData: any) => API.post('/auth/register', formData);

// /* ───────────── USERS ───────────── */
// export const fetchUsers = () => API.get('/users');
// export const fetchUser = (id: string) => API.get(`/users/${id}`);
// export const updateProfile = (profileData: any) =>
//   API.put('/users/profile', profileData);
// export const toggleFollow = (id: string) =>
//   API.put(`/users/${id}/follow`);
// export const toggleBlock = (id: string) =>
//   API.put(`/users/${id}/block`);
// export const deleteAccount = () =>
//   API.delete('/users/profile');

// /* ───────────── POSTS ───────────── */
// export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// export const fetchPosts = () => API.get('/posts');
// export const fetchFeedPosts = () => API.get('/posts/feed');
// export const createPost = (newPost: any) =>
//   API.post('/posts', newPost);
// export const deletePost = (id: string) =>
//   API.delete(`/posts/${id}`);
// export const likePost = (id: string) =>
//   API.put(`/posts/${id}/like`);
// export const commentOnPost = (id: string, commentData: any) =>
//   API.post(`/posts/${id}/comments`, commentData);
// export const deleteComment = (postId: string, commentId: string) =>
//   API.delete(`/posts/${postId}/comments/${commentId}`);

// /* ───────────── DIRECT MESSAGES ───────────── */
// export const fetchConversations = () =>
//   API.get('/messages/conversations');
// export const fetchMessages = (otherUserId: string) =>
//   API.get(`/messages/${otherUserId}`);
// export const sendMessage = (receiverId: string, messageData: any) =>
//   API.post(`/messages/send/${receiverId}`, messageData);

// /* ───────────── TRIBES ───────────── */
// export const fetchTribes = () => API.get('/tribes');
// export const fetchTribe = (id: string) =>
//   API.get(`/tribes/${id}`);
// export const createTribe = (tribeData: any) =>
//   API.post('/tribes', tribeData);
// export const updateTribe = (id: string, tribeData: any) =>
//   API.put(`/tribes/${id}`, tribeData);
// export const deleteTribe = (id: string) =>
//   API.delete(`/tribes/${id}`);
// export const joinTribe = (id: string) =>
//   API.put(`/tribes/${id}/join`);
// export const fetchTribeMessages = (id: string) =>
//   API.get(`/tribes/${id}/messages`);
// export const sendTribeMessage = (id: string, messageData: any) =>
//   API.post(`/tribes/${id}/messages`, messageData);
// export const deleteTribeMessage = (tribeId: string, messageId: string) =>
//   API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// /* ───────────── AI CHAT ───────────── */
// export const generateAiChat = (promptData: { prompt: string }) =>
//   API.post('/ai/chat', promptData);

// /* ───────────── NOTIFICATIONS ───────────── */
// export const fetchNotifications = () =>
//   API.get('/notifications');
// export const markNotificationsRead = () =>
//   API.put('/notifications/read');







import axios from 'axios';

const API_URL = 'https://tribe-social-backend.onrender.com';

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/* ───────────── HELPERS (NORMALIZATION) ───────────── */

const normalizeId = <T extends { _id?: string }>(obj: T) => {
  if (!obj) return obj;
  const { _id, ...rest } = obj as any;
  return { id: _id, ...rest };
};

const normalizeArray = <T extends { _id?: string }>(arr: T[]) =>
  arr.map(normalizeId);

/* ───────────── AUTH ───────────── */
export const login = (formData: any) => API.post('/auth/login', formData);
export const register = (formData: any) => API.post('/auth/register', formData);

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
