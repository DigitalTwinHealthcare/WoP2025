import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvX3i7H3OqNvJuUxTUOxoxWkpM6LTmtlg",
  authDomain: "digitwin-wop.firebaseapp.com",
  projectId: "digitwin-wop",
  storageBucket: "digitwin-wop.firebasestorage.app",
  messagingSenderId: "806373485022",
  appId: "1:806373485022:web:d3d3a9081a9d27fad1d54f",
  measurementId: "G-XR6XDG15JK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

