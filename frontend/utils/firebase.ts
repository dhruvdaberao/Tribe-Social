import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M",
  authDomain: "tribe-social-9eb0d.firebaseapp.com",
  projectId: "tribe-social-9eb0d",
  storageBucket: "tribe-social-9eb0d.firebasestorage.app",
  messagingSenderId: "593523133674",
  appId: "1:593523133674:web:7d1b275930e5d531441b93"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);
