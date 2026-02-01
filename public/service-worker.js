// Service Worker for Tribe Social - Push Notifications

const CACHE_NAME = 'tribe-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker: Installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activated');
    event.waitUntil(clients.claim());
});

// Push event - receive and display notification
self.addEventListener('push', (event) => {
    console.log('📩 Push event received');

    if (!event.data) {
        console.warn('⚠️ Push event has no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('📦 Push data:', data);

        const { title, body, icon, badge, data: notificationData } = data;

        // Validate required fields
        if (!title) {
            console.error('❌ Notification missing title');
            return;
        }

        const options = {
            body: body || '',
            icon: icon || '/logo-192.png', // Use existing PWA icon
            badge: badge || '/logo-192.png', // Use existing PWA icon
            data: notificationData || {},
            vibrate: [200, 100, 200],
            tag: notificationData?.type || 'default',
            requireInteraction: false,
            silent: false
        };

        console.log('🔔 Showing notification:', title);

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {
                    console.log('✅ Notification displayed successfully');
                })
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
    console.log('🖱️ Notification clicked');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    console.log('🔗 Opening URL:', fullUrl);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === fullUrl && 'focus' in client) {
                        console.log('✅ Focusing existing window');
                        return client.focus();
                    }
                }

                // If not, open a new window
                if (clients.openWindow) {
                    console.log('✅ Opening new window');
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
    console.log('🔄 Background sync:', event.tag);
});
