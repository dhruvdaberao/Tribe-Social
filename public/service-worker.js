// Service Worker for Tribe Social - Push Notifications

const CACHE_NAME = 'tribe-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(clients.claim());
});

// Push event - receive and display notification
self.addEventListener('push', (event) => {
    console.log('Push received:', event);

    if (!event.data) {
        console.log('Push event has no data');
        return;
    }

    try {
        const data = event.data.json();
        const { title, body, icon, badge, data: notificationData } = data;

        const options = {
            body,
            icon: icon || '/logo.png',
            badge: badge || '/logo.png',
            data: notificationData,
            vibrate: [200, 100, 200],
            tag: notificationData?.type || 'default',
            requireInteraction: false
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});

// Notification click event - handle navigation
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === fullUrl && 'focus' in client) {
                        return client.focus();
                    }
                }

                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(fullUrl);
                }
            })
    );
});

// Background sync (future feature)
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event.tag);
});
