import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BAjpMhHkdyiTm9zd4pYcp8kOkth7FHcId9_swudAH6OSI4brChi_3P0EME_zgwDYc-bGr7ZvwMc4Tnuu8QVlWug"
    });

    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Token error:", err);
    return null;
  }
};
