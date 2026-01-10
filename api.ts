import axios from 'axios';

const API_URL = 'https://tribe-social-backend.onrender.com';

const API = axios.create({ 
  baseURL: `${API_URL}/api`,
  timeout: 90000 // 90s to survive Render's spin-up time
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Retry Logic for GET requests to mitigate transient network drops
API.interceptors.response.use(
  response => response,
  async error => {
    const { config, code } = error;
    if (config && config.method === 'get' && !config._retry && (code === 'ECONNABORTED' || !error.response)) {
      config._retry = true;
      console.warn(`Retrying ${config.url} due to timeout...`);
      return API(config);
    }
    console.error(`[API ERROR] ${config?.url}:`, error.message);
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
export const deleteAccount = () => API.delete('/users/profile');

// Posts
export const fetchPost = (id: string) => API.get(`/posts/${id}`);
export const fetchPosts = (page = 1, limit = 20) => API.get(`/posts?page=${page}&limit=${limit}`);
export const fetchFeedPosts = (page = 1, limit = 20) => API.get(`/posts/feed?page=${page}&limit=${limit}`);
export const fetchUserPosts = (userId: string) => API.get(`/posts/user/${userId}`);
export const createPost = (newPost: any) => API.post('/posts', newPost);
export const deletePost = (id: string) => API.delete(`/posts/${id}`);
export const likePost = (id: string) => API.put(`/posts/${id}/like`);
export const commentOnPost = (id: string, data: any) => API.post(`/posts/${id}/comments`, data);

// Messages
export const fetchConversations = () => API.get('/messages/conversations');
export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
export const sendMessage = (receiverId: string, data: any) => API.post(`/messages/send/${receiverId}`, data);

// Tribes
export const fetchTribes = () => API.get('/tribes');
export const fetchMyTribes = () => API.get('/tribes/my-tribes');
export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
export const sendTribeMessage = (id: string, data: any) => API.post(`/tribes/${id}/messages`, data);

// AI & Notifications
export const generateAiChat = (data: { prompt: string }) => API.post('/ai/chat', data);
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read');

// Stories
export const createStory = (data: any) => API.post('/stories', data);
export const fetchMyStories = () => API.get('/stories/my-stories');
export const fetchFollowingStories = () => API.get('/stories/feed');