// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyBidjF8d27cj9yd12VWACHz-QhiYSNzDj0",
  authDomain: "telegram-bot-e91d5.firebaseapp.com",
  databaseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com",
  projectId: "telegram-bot-e91d5",
  storageBucket: "telegram-bot-e91d5.appspot.com",
  messagingSenderId: "655005641349",
  appId: "1:655005641349:web:e1568a5ec152fcdda4d7ec",
  measurementId: "G-RBN523KZVN",
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
