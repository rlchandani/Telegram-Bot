import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, onMessage, getToken } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const messageWebPushCertificate = "BJQ5zRoUxkqtktq3Z4wBm_ZJw7_xKDaw4NzSDpQo983oZwqeoeH-vx4Mjt-5pYIvOTCIJpiIdwwWUT67iEc_xBU";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
getAnalytics(app);

export const getTokenAction = (isTokenFound: boolean, setTokenFound: any) => {
  if (!isTokenFound) {
    getToken(messaging, { vapidKey: messageWebPushCertificate })
      .then((currentToken: any) => {
        if (currentToken) {
          console.log("Current token for client: ", currentToken);
          setTokenFound(true);
          // Track the token -> client mapping, by sending to backend server
          // show on the UI that permission is secured
        } else {
          console.log("No registration token available. Request permission to generate one.");
          setTokenFound(false);
          // shows on the UI that permission is required
        }
      })
      .catch((err: any) => {
        console.log("An error occurred while retrieving token. ", err);
        // catch error while creating client token
      });
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload: any) => {
      resolve(payload);
    });
  });
