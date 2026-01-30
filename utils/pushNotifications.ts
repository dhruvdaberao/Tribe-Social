/**
 * Push Notification Utilities for Tribe Social
 * Web Push API integration
 */

const PUBLIC_KEY_ENDPOINT = '/api/push/public-key';
const SUBSCRIBE_ENDPOINT = '/api/push/subscribe';
const UNSUBSCRIBE_ENDPOINT = '/api/push/unsubscribe';

let vapidPublicKey: string | null = null;

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ Service Worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return null;
    }
};

/**
 * Get VAPID public key from backend
 */
const getVapidPublicKey = async (): Promise<string | null> => {
    if (vapidPublicKey) return vapidPublicKey;

    try {
        const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
            ? 'http://localhost:5001'
            : 'https://tribe-social-backend.onrender.com';

        const response = await fetch(`${API_URL}${PUBLIC_KEY_ENDPOINT}`);

        if (!response.ok) {
            throw new Error('Failed to get VAPID key');
        }

        const data = await response.json();
        vapidPublicKey = data.publicKey;
        return vapidPublicKey;
    } catch (error) {
        console.error('Failed to get VAPID key:', error);
        return null;
    }
};

/**
 * URL-safe base64 decode
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (): Promise<boolean> => {
    try {
        // Check if permission granted
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return false;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        if (!registration) {
            console.error('No service worker registration');
            return false;
        }

        // Get VAPID public key
        const publicKey = await getVapidPublicKey();
        if (!publicKey) {
            console.error('No VAPID public key');
            return false;
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        console.log('✅ Push subscription created:', subscription.endpoint);

        // Send subscription to backend
        const success = await sendSubscriptionToBackend(subscription);
        return success;
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
        return false;
    }
};

/**
 * Send subscription to backend
 */
const sendSubscriptionToBackend = async (subscription: PushSubscription): Promise<boolean> => {
    try {
        const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
            ? 'http://localhost:5001'
            : 'https://tribe-social-backend.onrender.com';

        const token = localStorage.getItem('token')?.replace(/"/g, '').trim();
        if (!token) {
            console.error('No auth token');
            return false;
        }

        const response = await fetch(`${API_URL}${SUBSCRIBE_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }

        console.log('✅ Subscription saved to backend');
        return true;
    } catch (error) {
        console.error('Failed to send subscription to backend:', error);
        return false;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            console.log('No subscription to unsubscribe');
            return true;
        }

        // Unsubscribe locally
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push');

        // Remove from backend
        await removeSubscriptionFromBackend(subscription.endpoint);
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return false;
    }
};

/**
 * Remove subscription from backend
 */
const removeSubscriptionFromBackend = async (endpoint: string): Promise<void> => {
    try {
        const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
            ? 'http://localhost:5001'
            : 'https://tribe-social-backend.onrender.com';

        const token = localStorage.getItem('token')?.replace(/"/g, '').trim();
        if (!token) return;

        await fetch(`${API_URL}${UNSUBSCRIBE_ENDPOINT}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint })
        });

        console.log('✅ Subscription removed from backend');
    } catch (error) {
        console.error('Failed to remove subscription from backend:', error);
    }
};

/**
 * Check if user is already subscribed
 */
export const isSubscribedToPush = async (): Promise<boolean> => {
    try {
        if (!('serviceWorker' in navigator)) return false;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        return false;
    }
};
