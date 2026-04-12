



// import axios from 'axios';

// // The backend URL is now hardcoded here to prevent module loading failures
// // that were causing a blank screen. This makes the API layer more robust.
// const API_URL = 'https://tribe-social-backend.onrender.com';

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
// export const fetchFollowingStories = () => API.get('/stories/feed');
// export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
// export const likeStory = (id: string) => API.put(`/stories/${id}/like`);





import axios from 'axios';

const API_URL = 'https://tribe-social-backend.onrender.com';
const API = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

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

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    return req;
  }

  if (!isPublicEndpoint(req.url)) {
    handleUnauthorizedSession();
    return Promise.reject(new Error('Missing auth token'));
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !isPublicEndpoint(error?.config?.url)) {
      handleUnauthorizedSession();
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (formData: any) => API.post('/auth/login', formData);
export const register = (formData: any) => API.post('/auth/register', formData);
export const forgotPassword = (email: string) => API.post('/auth/forgot-password', { email });
export const verifyOtp = (email: string, otp: string) => API.post('/auth/verify-otp', { email, otp });

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
export const fetchUserPosts = (userId: string) => API.get(`/posts/user/${userId}`);
export const createPost = (newPost: any) => API.post('/posts', newPost);
export const deletePost = (id: string) => API.delete(`/posts/${id}`);
export const likePost = (id: string) => API.put(`/posts/${id}/like`);
export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// Conversations & Messages
export const fetchConversations = () => API.get('/messages/conversations');
export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);
export const deleteMessage = (messageId: string) => API.delete(`/messages/${messageId}`);
export const deleteMessageForMe = (messageId: string) => API.put(`/messages/${messageId}/delete-for-me`);
export const clearConversation = (otherUserId: string) => API.put(`/messages/clear/${otherUserId}`);

// Tribes
export const fetchTribes = () => API.get('/tribes');
export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);
export const deleteTribeMessageForMe = (tribeId: string, messageId: string) => API.put(`/tribes/${tribeId}/messages/${messageId}/delete-for-me`);
export const kickMember = (id: string, userId: string) => API.put(`/tribes/${id}/kick/${userId}`);

// AI Chat
export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// Notifications
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read');
export const createReport = (reportData: { targetId: string; targetType: string; reason: string; description?: string }) => API.post('/reports', reportData);

// Stories
export const createStory = (storyData: any) => API.post('/stories', storyData);
export const fetchMyStories = () => API.get('/stories/my-stories');
export const fetchFollowingStories = () => API.get('/stories/feed');
export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
export const likeStory = (id: string) => API.put(`/stories/${id}/like`);
// Admin / Moderation
export const fetchReports = () => API.get('/reports');
export const resolveReport = (id: string, action: 'dismiss' | 'ban' | 'delete_content') => API.put(`/reports/${id}/resolve`, { action });
