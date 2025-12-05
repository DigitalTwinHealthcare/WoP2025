import { useEffect, useState } from 'react'; // Force Rebuild v5
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import NewPatient from './pages/NewPatient';
import PatientDetail from './pages/PatientDetail';
import PatientOverview from './pages/PatientOverview';

import OrthoTwin from './pages/OrthoTwin';
import Cardiology from './pages/Cardiology';
import Dentistry from './pages/Dentistry';
import Pulmonology from './pages/Pulmonology';
import Neurology from './pages/Neurology';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { ThemeProvider } from './context/ThemeContext';

import './App.css';

const Layout = ({ user, children }) => {
  const location = useLocation();
  const hideNavbarPaths = ['cardiology', 'pulmonology', 'neurology', 'orthotwin', 'dentistry'];
  const fixedLayoutPaths = ['cardiology', 'pulmonology', 'neurology', 'orthotwin', 'dentistry'];
  const scrollableFullLayoutPaths = ['dashboard'];

  const shouldHideNavbar = hideNavbarPaths.some(path => location.pathname.toLowerCase().includes(path));
  const isFixedLayout = fixedLayoutPaths.some(path => location.pathname.toLowerCase().includes(path));
  const isScrollableFullLayout = scrollableFullLayoutPaths.some(path => location.pathname.toLowerCase().includes(path));

  let mainClass = "pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto";
  if (isFixedLayout) mainClass = "w-full h-screen overflow-hidden";
  if (isScrollableFullLayout) mainClass = "w-full min-h-screen";

  return (
    <div className="min-h-screen">
      {!shouldHideNavbar && <Navbar user={user} />}
      <main className={mainClass}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-dark-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-dark-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Layout user={user}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-patient"
              element={
                <ProtectedRoute>
                  <NewPatient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id"
              element={
                <ProtectedRoute>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/overview"
              element={
                <ProtectedRoute>
                  <PatientDetail showOverview={true} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orthotwin"
              element={
                <ProtectedRoute>
                  <OrthoTwin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/cardiology"
              element={
                <ProtectedRoute>
                  <Cardiology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/neurology"
              element={
                <ProtectedRoute>
                  <Neurology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/pulmonology"
              element={
                <ProtectedRoute>
                  <Pulmonology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cardiology"
              element={
                <ProtectedRoute>
                  <Cardiology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pulmonology"
              element={
                <ProtectedRoute>
                  <Pulmonology />
                </ProtectedRoute>
              }
            />
            <Route
              path="/neurology"
              element={
                <ProtectedRoute>
                  <Neurology />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
