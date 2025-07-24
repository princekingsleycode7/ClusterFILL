// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration from the .env.local file
const firebaseConfig = {
  apiKey: "AIzaSyD_GdHpzfEzNNEo9DHYBClD0Mx0zvJc1tI", 
  authDomain: "studio-p5ot0.firebaseapp.com",
  projectId: "studio-p5ot0",
  storageBucket: "studio-p5ot0.firebasestorage.app",
  messagingSenderId: "615610434342",
  appId: "1:615610434342:web:257c2681cd8b2b671cb7e7",
};

// Initialize Firebase
// To prevent re-initialization on hot-reloads, we check if an app is already initialized.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get references to the services we'll use
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions, httpsCallable };