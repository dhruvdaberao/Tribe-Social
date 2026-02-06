// Service Worker for Tribe Social - Push Notifications

const CACHE_NAME = 'tribe-v1';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Push event - receive and display notification
self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('⚠️ Push event has no data');
        return;
    }

    try {
        const data = event.data.json();
        const { title, body, icon, badge, tag, data: notificationData, url } = data;

        // Validate required fields
        if (!title) {
            console.error('❌ Notification missing title');
            return;
        }

        const options = {
            body: body || '',
            icon: icon || '/logo-192.png',
            badge: badge || '/logo-192.png',
            data: {
                ...(notificationData || {}),
                url: notificationData?.url || url || '/',
            },
            vibrate: [200, 100, 200],
            tag: tag || notificationData?.tag || notificationData?.type || 'default',
            requireInteraction: false,
            silent: false
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {})
                .catch((error) => {
                    console.error('❌ showNotification failed:', error);
                })
        );
    } catch (error) {
        console.error('❌ Error processing push event:', error);
    }
});

// Notification click event - handle navigation
self.addEventListener('notificationclick', (event) => {
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
            .catch((error) => {
                console.error('❌ Navigation failed:', error);
            })
    );
});

// Background sync (future feature)
self.addEventListener('sync', (event) => {
});
