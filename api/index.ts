// import axios from 'axios';

// // ✅ Backend base URL
// const API_URL = 'https://tribe-social-backend.onrender.com';

// // ✅ Central axios instance
// const API = axios.create({
//   baseURL: `${API_URL}/api`,
//   timeout: 15000,          // 🔴 Prevents infinite hangs
//   withCredentials: true,   // 🔴 Matches backend CORS config
// });

// // ✅ Attach JWT token
// API.interceptors.request.use(
//   (req) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       req.headers.Authorization = `Bearer ${token}`;
//     }
//     return req;
//   },
//   (error) => Promise.reject(error)
// );

// // ================= AUTH =================
// export const login = (formData: any) => API.post('/auth/login', formData);
// export const register = (formData: any) => API.post('/auth/register', formData);

// // ================= USERS =================
// export const fetchUsers = () => API.get('/users');
// export const fetchUser = (id: string) => API.get(`/users/${id}`);
// export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// export const deleteAccount = () => API.delete('/users/profile');

// // ================= POSTS =================
// export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// export const fetchPosts = () => API.get('/posts');
// export const fetchFeedPosts = () => API.get('/posts/feed');
// export const createPost = (newPost: any) => API.post('/posts', newPost);
// export const deletePost = (id: string) => API.delete(`/posts/${id}`);
// export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// export const commentOnPost = (id: string, commentData: any) =>
//   API.post(`/posts/${id}/comments`, commentData);
// export const deleteComment = (postId: string, commentId: string) =>
//   API.delete(`/posts/${postId}/comments/${commentId}`);

// // ================= MESSAGES =================
// export const fetchConversations = () => API.get('/messages/conversations');
// export const fetchMessages = (otherUserId: string) =>
//   API.get(`/messages/${otherUserId}`);
// export const sendMessage = (receiverId: string, messageData: any) =>
//   API.post(`/messages/send/${receiverId}`, messageData);

// // ================= TRIBES =================
// export const fetchTribes = () => API.get('/tribes');
// export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
// export const updateTribe = (id: string, tribeData: any) =>
//   API.put(`/tribes/${id}`, tribeData);
// export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
// export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// export const fetchTribeMessages = (id: string) =>
//   API.get(`/tribes/${id}/messages`);
// export const sendTribeMessage = (id: string, messageData: any) =>
//   API.post(`/tribes/${id}/messages`, messageData);
// export const deleteTribeMessage = (tribeId: string, messageId: string) =>
//   API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// // ================= AI =================
// export const generateAiChat = (promptData: { prompt: string }) =>
//   API.post('/ai/chat', promptData);

// // ================= NOTIFICATIONS =================
// export const fetchNotifications = () => API.get('/notifications');
// export const markNotificationsRead = () =>
//   API.put('/notifications/read');

// // ✅ Export axios instance for debugging if needed
// export default API;







import axios from 'axios';

const API_URL = 'https://tribe-social-backend.onrender.com';

const API = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// AUTH
export const login = (data: any) => API.post('/auth/login', data);
export const register = (data: any) => API.post('/auth/register', data);

// USERS
export const fetchUsers = () => API.get('/users');
export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);

// POSTS
export const fetchFeedPosts = () => API.get('/posts/feed');
export const likePost = (id: string) => API.put(`/posts/${id}/like`);
export const commentOnPost = (id: string, data: any) =>
  API.post(`/posts/${id}/comments`, data);

// TRIBES
export const fetchTribes = () => API.get('/tribes');
export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
export const fetchTribeMessages = (id: string) =>
  API.get(`/tribes/${id}/messages`);
export const sendTribeMessage = (id: string, data: any) =>
  API.post(`/tribes/${id}/messages`, data);
export const deleteTribeMessage = (tribeId: string, messageId: string) =>
  API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// NOTIFICATIONS
export const fetchNotifications = () => API.get('/notifications');

export default API;
