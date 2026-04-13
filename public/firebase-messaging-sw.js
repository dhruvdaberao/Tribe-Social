importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M',
  authDomain: 'tribe-social-9eb0d.firebaseapp.com',
  projectId: 'tribe-social-9eb0d',
  storageBucket: 'tribe-social-9eb0d.firebasestorage.app',
  messagingSenderId: '593523133674',
  appId: '1:593523133674:web:7d1b275930e5d531441b93',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Received background message:', payload);
  
  const title = payload.data?.title || payload.notification?.title || 'Tribe Social';
  const options = {
    body: payload.data?.body || payload.notification?.body || '',
    icon: payload.data?.icon || payload.notification?.icon || '/icons/icon-192-dark.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
