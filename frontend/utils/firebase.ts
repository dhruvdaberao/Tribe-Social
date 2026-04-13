import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tribe-social-9eb0d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tribe-social-9eb0d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tribe-social-9eb0d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '593523133674',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:593523133674:web:7d1b275930e5d531441b93',
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let cachedMessaging: Messaging | null = null;

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  if (cachedMessaging) return cachedMessaging;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('[FCM] Firebase messaging is not supported in this browser/environment.');
    return null;
  }

  cachedMessaging = getMessaging(app);
  return cachedMessaging;
};

export { app };
