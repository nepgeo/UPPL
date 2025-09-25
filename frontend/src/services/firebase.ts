import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC9PZHpHwLE2Go7YclOVj8bmPdNd_ODF5E",
  authDomain: "uppl-9fb14.firebaseapp.com",
  projectId: "uppl-9fb14",
  storageBucket: "uppl-9fb14.firebasestorage.app",
  messagingSenderId: "433456367033",
  appId: "1:433456367033:web:0eaecd1efe3d23d4f36268",
  measurementId: "G-J1LRE1SDC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // optional

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Helper function for Google login
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export default app;
