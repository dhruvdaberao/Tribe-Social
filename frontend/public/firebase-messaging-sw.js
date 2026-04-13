/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M',
  authDomain: 'tribe-social-9eb0d.firebaseapp.com',
  projectId: 'tribe-social-9eb0d',
  storageBucket: 'tribe-social-9eb0d.firebasestorage.app',
  messagingSenderId: '593523133674',
  appId: '1:593523133674:web:7d1b275930e5d531441b93',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.info('[FCM SW] Background message received:', payload);

  const notification = payload?.notification || {};
  const data = payload?.data || {};

  const title = notification.title || data.title || 'Tribe Social';
  const options = {
    body: notification.body || data.body || 'You have a new notification.',
    icon: notification.icon || data.icon || '/icons/icon-192-dark.png',
    badge: '/icons/icon-192-dark.png',
    data: {
      url: data.url || '/',
    },
    tag: data.tag || 'tribe-social-notification',
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'PUSH_CLICK', url: targetUrl });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
