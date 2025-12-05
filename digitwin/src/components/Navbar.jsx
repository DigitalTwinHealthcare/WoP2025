import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FiUser } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = ({ user }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 flex justify-center z-50 px-4">
      <nav className="w-full max-w-6xl bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full px-6 py-1 shadow-2xl">
        <div className="flex items-center justify-between">
          {/* Left Side: Logo + Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">Digital Twin</span>
            </Link>

            {/* Links */}
            <div className="hidden md:flex items-center space-x-6">
              {user && navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${location.pathname === link.to
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side (User/Profile) */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex max-w-xs items-center rounded-full bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-white">
                      <FiUser size={14} />
                    </div>
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm text-white font-medium truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 !bg-transparent hover:!bg-zinc-800"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
