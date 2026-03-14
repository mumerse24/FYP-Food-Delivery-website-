import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api";

// This config should be updated with actual keys from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDLqJhWeKlFHCA3DRUBT8lrCTo1Z-p1bwY",
    authDomain: "food-delivery-app-f3bd5.firebaseapp.com",
    projectId: "food-delivery-app-f3bd5",
    storageBucket: "food-delivery-app-f3bd5.firebasestorage.app",
    messagingSenderId: "562284218391",
    appId: "1:562284218391:web:ba5b9d4e90d9fceab5f452",
    measurementId: "G-1W7SKJHQE6"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: "BHC9_3cQ4cowdqg4Hh9YA_0QccBN_C3urQbZSYTBW0HqxHA1NxypdvJeFwC0c4QSv8-m-HFdcmd5mBA24Kut_pM"
            });
            if (token) {
                console.log("✅ Notifications enabled and synchronized");
                // Sync token with backend
                await api.post("/auth/fcm-token", { token });
                return token;
            }
        }
    } catch (error) {
        console.error("❌ Notification setup error:", error);
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
    });
};
