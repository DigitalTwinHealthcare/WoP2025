# Firebase Setup Guide

## Quick Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Enable it and click **Save**

### 3. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app, click **</>** (Web icon) to add one
5. Copy the configuration values

### 4. Configure the App

You have two options:

#### Option A: Using Environment Variables (Recommended)

Create a `.env` file in the root directory (`Cardiology/digitwin/.env`):

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the values with your actual Firebase config values.

#### Option B: Direct Configuration

Edit `src/config/firebase.js` and replace the placeholder values:

```javascript
const config = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. Restart the Development Server

After configuring Firebase:

```bash
npm run dev
```

## How Authentication Works

### Sign Up (Create Account)
- When a user signs up, `createUserWithEmailAndPassword()` is called
- Firebase automatically:
  - Creates a new user account
  - Stores the email and hashed password securely
  - Signs the user in automatically
  - Returns user credentials

### Sign In (Login)
- When a user signs in, `signInWithEmailAndPassword()` is called
- Firebase:
  - Validates the email and password
  - Authenticates the user
  - Returns user credentials
  - Maintains the session

### User Data Storage
- Firebase Authentication stores:
  - Email address
  - Password (hashed, never stored in plain text)
  - User ID (unique identifier)
  - Creation timestamp
  - Last sign-in timestamp

All user data is automatically managed by Firebase - you don't need to manually store or fetch it!

## Testing

1. Start the app: `npm run dev`
2. Click "Don't have an account? Sign up"
3. Enter an email and password (min 6 characters)
4. Click "Sign Up"
5. You should be redirected to the dashboard
6. Sign out and sign in again with the same credentials

## Troubleshooting

### "Firebase is not configured" error
- Make sure you've added your Firebase config to `.env` or `firebase.js`
- Restart the dev server after adding environment variables
- Check the browser console for detailed error messages

### "auth/email-already-in-use"
- The email is already registered
- Use "Sign in" instead of "Sign up"

### "auth/user-not-found"
- No account exists with that email
- Sign up first, then sign in

### "auth/wrong-password"
- Incorrect password entered
- Try again or use password reset (if implemented)

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Firebase handles password hashing automatically
- All authentication is handled securely by Firebase

