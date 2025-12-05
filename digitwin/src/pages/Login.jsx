import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError(
        'Firebase is not configured. Please configure Firebase first. ' +
        'Check the browser console for setup instructions or update src/config/firebase.js with your Firebase credentials.'
      );
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up - This creates a new user in Firebase Authentication
        // The user data (email, password) is automatically stored in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ User created successfully:', userCredential.user.email);
        // After successful signup, Firebase automatically signs the user in
        navigate('/dashboard');
      } else {
        // Sign in - This authenticates the user and fetches their data from Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ User signed in successfully:', userCredential.user.email);
        // After successful login, navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      // Handle specific Firebase errors
      let errorMessage = 'An error occurred. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-background flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-primary mb-2">Digi Twin</h1>
          <p className="text-sm text-dark-secondary">Digital Twins for Healthcare</p>
        </div>

        {!auth && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Firebase Not Configured</p>
            <p className="text-xs text-yellow-700 mb-3">
              To enable authentication, please configure Firebase:
            </p>
            <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
              <li>Go to Firebase Console (console.firebase.google.com)</li>
              <li>Create a project and enable Email/Password authentication</li>
              <li>Copy your config to .env file or src/config/firebase.js</li>
            </ol>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-secondary mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition text-sm"
              placeholder="doctor@hospital.com"
              required
              disabled={!auth}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark-secondary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition text-sm"
              placeholder="Enter your password (min. 6 characters)"
              required
              minLength={6}
              disabled={!auth}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !auth}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
            disabled={!auth}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {auth && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong><br />
              {isSignUp
                ? 'Sign Up creates a new account in Firebase. Your email and password are securely stored.'
                : 'Sign In authenticates you using your Firebase account credentials.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
