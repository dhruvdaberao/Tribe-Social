import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

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

    console.log("Requesting permission...");
    const permission = await Notification.requestPermission();
    console.log("Permission:", permission);

    if (permission !== "granted") {
      console.warn("Notification permission is not granted.");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: "BAjpMhHkdyiTm9zd4pYcp8kOkth7FHcId9_swudAH6OSI4brChi_3P0EME_zgwDYc-bGr7ZvwMc4Tnuu8QVlWug",
      serviceWorkerRegistration: registration
    });

    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Token error:", err);
    return null;
  }
};
