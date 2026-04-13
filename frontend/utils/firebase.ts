type FirebaseModule = {
  getApp: () => unknown;
  getApps: () => unknown[];
  initializeApp: (config: Record<string, string>) => unknown;
};

type MessagingModule = {
  getMessaging: (app?: unknown) => unknown;
  isSupported: () => Promise<boolean>;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tribe-social-9eb0d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tribe-social-9eb0d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tribe-social-9eb0d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '593523133674',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:593523133674:web:7d1b275930e5d531441b93',
};

let appInstance: unknown | null = null;
let cachedMessaging: unknown | null = null;

const loadFirebaseModules = async (): Promise<{ app: FirebaseModule; messaging: MessagingModule }> => {
  const [appModule, messagingModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging.js'),
  ]);

  return {
    app: appModule as unknown as FirebaseModule,
    messaging: messagingModule as unknown as MessagingModule,
  };
};

const getFirebaseApp = async (): Promise<unknown> => {
  if (appInstance) return appInstance;

  const { app } = await loadFirebaseModules();
  appInstance = app.getApps().length ? app.getApp() : app.initializeApp(firebaseConfig);
  return appInstance;
};

export const getFirebaseMessaging = async (): Promise<unknown | null> => {
  if (typeof window === 'undefined') return null;
  if (cachedMessaging) return cachedMessaging;

  const { messaging } = await loadFirebaseModules();
  const supported = await messaging.isSupported().catch(() => false);

  if (!supported) {
    console.warn('[FCM] Firebase messaging is not supported in this browser/environment.');
    return null;
  }

  const app = await getFirebaseApp();
  cachedMessaging = messaging.getMessaging(app);
  return cachedMessaging;
};

export const app = getFirebaseApp;
