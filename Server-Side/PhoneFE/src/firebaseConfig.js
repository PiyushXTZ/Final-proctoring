// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDB_SN0ZeRoWBOGlmVAMVSCPEa4gt0Tj5c",
    authDomain: "image-be8ac.firebaseapp.com",
    projectId: "image-be8ac",
    storageBucket: "image-be8ac.appspot.com",
    messagingSenderId: "3185781048",
    appId: "1:3185781048:web:e6025a003c7df4881c39cd",
    measurementId: "G-9PRMDRPSBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, collection, doc, getDoc, setDoc }; // ✅ Export Firestore methods
