// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This config should be updated with actual keys from Firebase Console
firebase.initializeApp({
    apiKey: "AIzaSyDLqJhWeKlFHCA3DRUBT8lrCTo1Z-p1bwY",
    authDomain: "food-delivery-app-f3bd5.firebaseapp.com",
    projectId: "food-delivery-app-f3bd5",
    storageBucket: "food-delivery-app-f3bd5.firebasestorage.app",
    messagingSenderId: "562284218391",
    appId: "1:562284218391:web:ba5b9d4e90d9fceab5f452",
    measurementId: "G-1W7SKJHQE6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png' // Make sure you have a logo.png in public folder or update this
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
