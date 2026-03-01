// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
	authDomain: "mediva-health.firebaseapp.com",
	projectId: "mediva-health",
	storageBucket: "mediva-health.firebasestorage.app",
	messagingSenderId: "738871917498",
	appId: "1:738871917498:web:44232ca2b18db91a4b7b83",
	measurementId: "G-HDDY92V5EP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === "web") {
  // 🌐 Web: use normal auth
  auth = getAuth(app);
} else {
  // 📱 Mobile: use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

export const db = getFirestore(app);

// Initialize Storage
// export const storage = getStorage(app);
