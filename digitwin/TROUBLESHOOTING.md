# Troubleshooting Blank Screen

If you're seeing a blank screen, follow these steps:

## 1. Check Browser Console

Open your browser's developer tools (F12) and check the Console tab for errors. Common errors:

- **Firebase initialization errors**: If you see errors about Firebase config, you need to set up your Firebase credentials
- **Import errors**: Check if all imports are correct
- **React errors**: Look for React component errors

## 2. Verify Firebase Configuration

The app requires Firebase to be configured. Create a `.env` file in the root directory with:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 3. Quick Test

To test if the app renders at all, temporarily comment out Firebase initialization in `src/config/firebase.js`:

```javascript
// Temporarily disable Firebase to test rendering
let app = null;
let auth = null;
```

Then check if the login page appears.

## 4. Common Issues

### Issue: "Cannot read property of undefined"
- **Solution**: Check that all imports are correct and files exist

### Issue: Firebase errors
- **Solution**: Make sure Firebase is properly configured or the app will show an error message

### Issue: Routing not working
- **Solution**: Check that React Router is properly set up

## 5. Development Server

Make sure you're running:
```bash
npm run dev
```

And accessing the correct URL (usually `http://localhost:5173`)

## 6. Clear Cache

Try clearing your browser cache or opening in incognito mode.

