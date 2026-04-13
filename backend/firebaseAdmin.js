import admin from 'firebase-admin';

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT is not configured. Push sending is disabled.');
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch (error) {
      console.error('[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
      return null;
    }
  }
};

const serviceAccount = parseServiceAccount();

if (serviceAccount && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.info('[FCM] Firebase Admin initialized successfully.');
}

export const isFirebaseAdminReady = () => admin.apps.length > 0;
export default admin;
