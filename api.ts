






// import axios from 'axios';

// // The backend URL is now hardcoded here to prevent module loading failures
// // that were causing a blank screen. This makes the API layer more robust.
// const API_URL = 'https://tribe-social2.onrender.com';

// const API = axios.create({ baseURL: `${API_URL}/api` });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// // Auth
// export const login = (formData: any) => API.post('/auth/login', formData);
// export const register = (formData: any) => API.post('/auth/register', formData);

// // Users
// export const fetchUsers = () => API.get('/users');
// export const fetchUser = (id: string) => API.get(`/users/${id}`);
// export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// export const deleteAccount = () => API.delete('/users/profile');

// // Posts
// export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// export const fetchPosts = () => API.get('/posts');
// export const fetchFeedPosts = () => API.get('/posts/feed');
// export const createPost = (newPost: any) => API.post('/posts', newPost);
// export const deletePost = (id: string) => API.delete(`/posts/${id}`);
// export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
// export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// // Conversations & Messages
// export const fetchConversations = () => API.get('/messages/conversations');
// export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
// export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);

// // Tribes
// export const fetchTribes = () => API.get('/tribes');
// export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
// export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
// export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
// export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
// export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
// export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// // AI Chat
// export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// // Notifications
// export const fetchNotifications = () => API.get('/notifications');
// export const markNotificationsRead = () => API.put('/notifications/read');

// // Stories
// export const createStory = (storyData: any) => API.post('/stories', storyData);
// export const fetchMyStories = () => API.get('/stories/my-stories');
// export const deleteStory = (id: string) => API.delete(`/stories/${id}`);









import axios from 'axios';

// The backend URL is now hardcoded here to prevent module loading failures
// that were causing a blank screen. This makes the API layer more robust.
const API_URL = 'https://tribe-social2.onrender.com';

const API = axios.create({ baseURL: `${API_URL}/api` });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const login = (formData: any) => API.post('/auth/login', formData);
export const register = (formData: any) => API.post('/auth/register', formData);

// Users
export const fetchUsers = () => API.get('/users');
export const fetchUser = (id: string) => API.get(`/users/${id}`);
export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
export const deleteAccount = () => API.delete('/users/profile');

// Posts
export const fetchPost = (id: string) => API.get(`/posts/${id}`);
export const fetchPosts = () => API.get('/posts');
export const fetchFeedPosts = () => API.get('/posts/feed');
export const createPost = (newPost: any) => API.post('/posts', newPost);
export const deletePost = (id: string) => API.delete(`/posts/${id}`);
export const likePost = (id: string) => API.put(`/posts/${id}/like`);
export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// Conversations & Messages
export const fetchConversations = () => API.get('/messages/conversations');
export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);

// Tribes
export const fetchTribes = () => API.get('/tribes');
export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// AI Chat
export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// Notifications
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read');

// Stories
export const createStory = (storyData: any) => API.post('/stories', storyData);
export const fetchMyStories = () => API.get('/stories/my-stories');
export const fetchFollowingStories = () => API.get('/stories/feed');
export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
export const likeStory = (id: string) => API.put(`/stories/${id}/like`);