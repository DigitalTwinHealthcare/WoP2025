import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const getFirebaseConfig = () => {
  // Firebase configuration - Replace with your actual Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyAvX3i7H3OqNvJuUxTUOxoxWkpM6LTmtlg",
    authDomain: "digitwin-wop.firebaseapp.com",
    projectId: "digitwin-wop",
    storageBucket: "digitwin-wop.firebasestorage.app",
    messagingSenderId: "806373485022",
    appId: "1:806373485022:web:d3d3a9081a9d27fad1d54f",
    measurementId: "G-XR6XDG15JK"
  };
  
  // Check if Firebase is properly configured
  if (!firebaseConfig.apiKey || 
      !firebaseConfig.authDomain || 
      !firebaseConfig.projectId) {
    return null;
  }
  
  return firebaseConfig;
};

// Initialize Firebase with error handling
let app = null;
let auth = null;

const firebaseConfig = getFirebaseConfig();

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.warn('⚠️ Firebase not properly configured. Please check your Firebase config.');
  }
} else {
  console.warn('⚠️ Firebase not configured.');
  console.warn('📝 To configure Firebase:');
  console.warn('   1. Go to https://console.firebase.google.com/');
  console.warn('   2. Create a project or select an existing one');
  console.warn('   3. Enable Authentication > Sign-in method > Email/Password');
  console.warn('   4. Go to Project Settings > General');
  console.warn('   5. Copy your config values to firebase.js');
}

export { auth };
export default app;
