importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCsKTEcvgHTq9xh-r-j8WHtZEARc-i4_9M",
  authDomain: "tribe-social-9eb0d.firebaseapp.com",
  projectId: "tribe-social-9eb0d",
  messagingSenderId: "593523133674",
  appId: "1:593523133674:web:7d1b275930e5d531441b93"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body
  });
});
