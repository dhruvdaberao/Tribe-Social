import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY = "BAjpMhHkdyiTm9zd4pYcp8kOkth7FHcId9_swudAH6OSI4brChi_3P0EME_zgwDYc-bGr7ZvwMc4Tnuu8QVlWug";

export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("Notifications are not supported in this browser.");
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported in this browser.");
      return null;
    }

    console.log("Requesting notification permission...");

    const permission = await Notification.requestPermission();
    console.log("Permission:", permission);

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.warn("No FCM registration token returned by Firebase.");
      return null;
    }

    console.log("FCM Token:", token);

    return token;
  } catch (err) {
    console.error("Token error:", err);
    return null;
  }
};

export const setupForegroundNotifications = () => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);

    if (Notification.permission === "granted" && payload.notification?.title) {
      new Notification(payload.notification.title, {
        body: payload.notification.body
      });
    }
  });
};
