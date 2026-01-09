



// // // import axios from 'axios';

// // // // The backend URL is now hardcoded here to prevent module loading failures
// // // // that were causing a blank screen. This makes the API layer more robust.
// // // const API_URL = 'https://tribe-social-backend.onrender.com';

// // // const API = axios.create({ baseURL: `${API_URL}/api` });

// // // API.interceptors.request.use((req) => {
// // //   const token = localStorage.getItem('token');
// // //   if (token) {
// // //     req.headers.Authorization = `Bearer ${token}`;
// // //   }
// // //   return req;
// // // });

// // // // Auth
// // // export const login = (formData: any) => API.post('/auth/login', formData);
// // // export const register = (formData: any) => API.post('/auth/register', formData);

// // // // Users
// // // export const fetchUsers = () => API.get('/users');
// // // export const fetchUser = (id: string) => API.get(`/users/${id}`);
// // // export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// // // export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// // // export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// // // export const deleteAccount = () => API.delete('/users/profile');

// // // // Posts
// // // export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// // // export const fetchPosts = () => API.get('/posts');
// // // export const fetchFeedPosts = () => API.get('/posts/feed');
// // // export const createPost = (newPost: any) => API.post('/posts', newPost);
// // // export const deletePost = (id: string) => API.delete(`/posts/${id}`);
// // // export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// // // export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
// // // export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// // // // Conversations & Messages
// // // export const fetchConversations = () => API.get('/messages/conversations');
// // // export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
// // // export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);

// // // // Tribes
// // // export const fetchTribes = () => API.get('/tribes');
// // // export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
// // // export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
// // // export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
// // // export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// // // export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
// // // export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
// // // export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// // // // AI Chat
// // // export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// // // // Notifications
// // // export const fetchNotifications = () => API.get('/notifications');
// // // export const markNotificationsRead = () => API.put('/notifications/read');

// // // // Stories
// // // export const createStory = (storyData: any) => API.post('/stories', storyData);
// // // export const fetchMyStories = () => API.get('/stories/my-stories');
// // // export const fetchFollowingStories = () => API.get('/stories/feed');
// // // export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
// // // export const likeStory = (id: string) => API.put(`/stories/${id}/like`);









// // // import axios from 'axios';

// // // const API_URL = 'https://tribe-social-backend.onrender.com';
// // // const API = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

// // // API.interceptors.request.use((req) => {
// // //   const token = localStorage.getItem('token');
// // //   if (token) {
// // //     req.headers.Authorization = `Bearer ${token}`;
// // //   }
// // //   return req;
// // // });

// // // // Auth
// // // export const login = (formData: any) => API.post('/auth/login', formData);
// // // export const register = (formData: any) => API.post('/auth/register', formData);
// // // export const forgotPassword = (email: string) => API.post('/auth/forgot-password', { email });
// // // export const verifyOtp = (email: string, otp: string) => API.post('/auth/verify-otp', { email, otp });

// // // // Users
// // // export const fetchUsers = () => API.get('/users');
// // // export const fetchUser = (id: string) => API.get(`/users/${id}`);
// // // export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// // // export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// // // export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// // // export const deleteAccount = () => API.delete('/users/profile');

// // // // Posts
// // // export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// // // export const fetchPosts = () => API.get('/posts');
// // // export const fetchFeedPosts = () => API.get('/posts/feed');
// // // export const createPost = (newPost: any) => API.post('/posts', newPost);
// // // export const deletePost = (id: string) => API.delete(`/posts/${id}`);
// // // export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// // // export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
// // // export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// // // // Conversations & Messages
// // // export const fetchConversations = () => API.get('/messages/conversations');
// // // export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
// // // export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);

// // // // Tribes
// // // export const fetchTribes = () => API.get('/tribes');
// // // export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
// // // export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
// // // export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
// // // export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// // // export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
// // // export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
// // // export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// // // // AI Chat
// // // export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// // // // Notifications
// // // export const fetchNotifications = () => API.get('/notifications');
// // // export const markNotificationsRead = () => API.put('/notifications/read');

// // // // Stories
// // // export const createStory = (storyData: any) => API.post('/stories', storyData);
// // // export const fetchMyStories = () => API.get('/stories/my-stories');
// // // export const fetchFollowingStories = () => API.get('/stories/feed');
// // // export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
// // // export const likeStory = (id: string) => API.put(`/stories/${id}/like`);






// // import axios from 'axios';

// // // Ensure this matches your ACTUAL Render backend URL
// // const API_URL = 'https://tribe-social-backend.onrender.com';

// // const API = axios.create({ 
// //   baseURL: `${API_URL}/api`,
// //   timeout: 60000 // 60 seconds to accommodate Render free tier cold starts
// // });

// // API.interceptors.request.use((req) => {
// //   const token = localStorage.getItem('token');
// //   if (token) {
// //     req.headers.Authorization = `Bearer ${token}`;
// //   }
// //   return req;
// // });

// // // Add a response interceptor to handle timeouts gracefully in the console
// // API.interceptors.response.use(
// //   response => response,
// //   error => {
// //     if (error.code === 'ECONNABORTED') {
// //       console.warn('API Request timed out. The backend might be waking up or struggling with a large query.');
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// // // Auth
// // export const login = (formData: any) => API.post('/auth/login', formData);
// // export const register = (formData: any) => API.post('/auth/register', formData);
// // export const forgotPassword = (email: string) => API.post('/auth/forgot-password', { email });
// // export const verifyOtp = (email: string, otp: string) => API.post('/auth/verify-otp', { email, otp });

// // // Users
// // export const fetchUsers = () => API.get('/users');
// // export const fetchUser = (id: string) => API.get(`/users/${id}`);
// // export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// // export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// // export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// // export const deleteAccount = () => API.delete('/users/profile');

// // // Posts - Updated with pagination support
// // export const fetchPost = (id: string) => API.get(`/posts/${id}`);
// // export const fetchPosts = (page = 1, limit = 10) => API.get(`/posts?page=${page}&limit=${limit}`);
// // export const fetchFeedPosts = (page = 1, limit = 10) => API.get(`/posts/feed?page=${page}&limit=${limit}`);
// // export const createPost = (newPost: any) => API.post('/posts', newPost);
// // export const deletePost = (id: string) => API.delete(`/posts/${id}`);
// // export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// // export const commentOnPost = (id: string, commentData: any) => API.post(`/posts/${id}/comments`, commentData);
// // export const deleteComment = (postId: string, commentId: string) => API.delete(`/posts/${postId}/comments/${commentId}`);

// // // Conversations & Messages
// // export const fetchConversations = () => API.get('/messages/conversations');
// // export const fetchMessages = (otherUserId: string) => API.get(`/messages/${otherUserId}`);
// // export const sendMessage = (receiverId: string, messageData: any) => API.post(`/messages/send/${receiverId}`, messageData);

// // // Tribes
// // export const fetchTribes = () => API.get('/tribes');
// // export const createTribe = (tribeData: any) => API.post('/tribes', tribeData);
// // export const updateTribe = (id: string, tribeData: any) => API.put(`/tribes/${id}`, tribeData);
// // export const deleteTribe = (id: string) => API.delete(`/tribes/${id}`);
// // export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// // export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
// // export const sendTribeMessage = (id: string, messageData: any) => API.post(`/tribes/${id}/messages`, messageData);
// // export const deleteTribeMessage = (tribeId: string, messageId: string) => API.delete(`/tribes/${tribeId}/messages/${messageId}`);

// // // AI Chat
// // export const generateAiChat = (promptData: { prompt: string }) => API.post('/ai/chat', promptData);

// // // Notifications
// // export const fetchNotifications = () => API.get('/notifications');
// // export const markNotificationsRead = () => API.put('/notifications/read');

// // // Stories
// // export const createStory = (storyData: any) => API.post('/stories', storyData);
// // export const fetchMyStories = () => API.get('/stories/my-stories');
// // export const fetchFollowingStories = () => API.get('/stories/feed');
// // export const deleteStory = (id: string) => API.delete(`/stories/${id}`);
// // export const likeStory = (id: string) => API.put(`/stories/${id}/like`);







// import axios from 'axios';

// const API_URL = 'https://tribe-social-backend.onrender.com';

// const API = axios.create({ 
//   baseURL: `${API_URL}/api`,
//   timeout: 20000 
// });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem('token');
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// });

// API.interceptors.response.use(
//   response => response,
//   async error => {
//     const config = error.config;
//     if (error.code === 'ECONNABORTED' && !config._retry) {
//       config._retry = true;
//       console.warn('Retrying request due to timeout...');
//       return API(config);
//     }
//     return Promise.reject(error);
//   }
// );

// // Auth
// export const login = (formData: any) => API.post('/auth/login', formData);
// export const register = (formData: any) => API.post('/auth/register', formData);
// export const forgotPassword = (email: string) => API.post('/auth/forgot-password', { email });
// export const verifyOtp = (email: string, otp: string) => API.post('/auth/verify-otp', { email, otp });

// // Users
// export const fetchUsers = () => API.get('/users');
// export const fetchUser = (id: string) => API.get(`/users/${id}`);
// export const updateProfile = (profileData: any) => API.put('/users/profile', profileData);
// export const toggleFollow = (id: string) => API.put(`/users/${id}/follow`);
// export const toggleBlock = (id: string) => API.put(`/users/${id}/block`);
// export const deleteAccount = () => API.delete('/users/profile');

// // Posts
// export const fetchFeedPosts = (page = 1, limit = 10) => API.get(`/posts/feed?page=${page}&limit=${limit}`);
// export const fetchPosts = (page = 1, limit = 10) => API.get(`/posts?page=${page}&limit=${limit}`);
// export const fetchUserPosts = (userId: string) => API.get(`/posts/user/${userId}`);
// export const createPost = (newPost: any) => API.post('/posts', newPost);
// export const likePost = (id: string) => API.put(`/posts/${id}/like`);
// export const commentOnPost = (id: string, data: any) => API.post(`/posts/${id}/comments`, data);
// export const deletePost = (id: string) => API.delete(`/posts/${id}`);

// // Realtime
// export const fetchConversations = () => API.get('/messages/conversations');
// export const fetchMessages = (id: string) => API.get(`/messages/${id}`);
// export const sendMessage = (id: string, data: any) => API.post(`/messages/send/${id}`, data);

// // Tribes
// export const fetchTribes = () => API.get('/tribes');
// export const fetchMyTribes = () => API.get('/tribes/my-tribes');
// export const joinTribe = (id: string) => API.put(`/tribes/${id}/join`);
// export const fetchTribeMessages = (id: string) => API.get(`/tribes/${id}/messages`);
// export const sendTribeMessage = (id: string, data: any) => API.post(`/tribes/${id}/messages`, data);

// // AI & Notifications
// export const generateAiChat = (data: { prompt: string }) => API.post('/ai/chat', data);
// export const fetchNotifications = () => API.get('/notifications');
// export const markNotificationsRead = () => API.put('/notifications/read');

// // Stories
// export const createStory = (data: any) => API.post('/stories', data);
// export const fetchMyStories = () => API.get('/stories/my-stories');
// export const fetchFollowingStories = () => API.get('/stories/feed');




import axios from 'axios';

const API_URL = 'https://tribe-social-backend.onrender.com';

const API = axios.create({ 
  baseURL: `${API_URL}/api`,
  timeout: 90000 // Increased to 90s to survive Render's heavy cold starts
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Recovery Logic: Automatic Retry for GET requests on timeout/network failure
API.interceptors.response.use(
  response => response,
  async error => {
    const { config, code } = error;
    // Only retry GET requests once to prevent infinite loops but recover from cold starts
    if (config && config.method === 'get' && !config._retry && (code === 'ECONNABORTED' || !error.response)) {
      config._retry = true;
      console.warn(`Cold start recovery: Retrying ${config.url}...`);
      return API(config);
    }
    console.error(`API Failure [${config?.url}]:`, error.message);
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
export const fetchFeedPosts = (page = 1, limit = 20) => API.get(`/posts/feed?page=${page}&limit=${limit}`);
export const fetchPosts = (page = 1, limit = 20) => API.get(`/posts?page=${page}&limit=${limit}`);
export const fetchUserPosts = (userId: string) => API.get(`/posts/user/${userId}`);
export const createPost = (newPost: any) => API.post('/posts', newPost);
export const likePost = (id: string) => API.put(`/posts/${id}/like`);
export const commentOnPost = (id: string, data: any) => API.post(`/posts/${id}/comments`, data);
export const deletePost = (id: string) => API.delete(`/posts/${id}`);

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