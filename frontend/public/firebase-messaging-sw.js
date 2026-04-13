import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-sw.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M',
  authDomain: 'tribe-social-9eb0d.firebaseapp.com',
  projectId: 'tribe-social-9eb0d',
  storageBucket: 'tribe-social-9eb0d.firebasestorage.app',
  messagingSenderId: '593523133674',
  appId: '1:593523133674:web:7d1b275930e5d531441b93',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title || 'Tribe Social';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192-dark.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
