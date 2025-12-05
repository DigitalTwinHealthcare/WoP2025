import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LayoutDashboard, Users, UserPlus, FileText, LogOut, Stethoscope, Activity } from 'lucide-react';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const Sidebar = ({ doctorName = "Dr. Sarah Johnson" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/patients', label: 'Patients', icon: 'Users' },
    { path: '/new-patient', label: 'New Patient', icon: 'UserPlus' },
    { path: '/pulmonology', label: 'Pulmonology', icon: 'Activity' },
  ];

  const handleLogout = async () => {
    if (!auth) {
      navigate('/login');
      return;
    }
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/login');
    }
  };

  return (
    <div className="w-64 bg-dark-card border-r border-dark-border h-screen fixed left-0 top-0 flex flex-col">
      {/* Doctor Name Section */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
            <Stethoscope size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-dark-primary text-sm">{doctorName}</h2>
            <p className="text-xs text-dark-secondary">Cardiologist</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${isActive
                    ? 'bg-light dark:bg-dark-border text-dark-primary font-medium shadow-sm'
                    : 'text-dark-secondary hover:bg-light/50 dark:hover:bg-dark-border/50 hover:text-primary dark:hover:text-dark-primary'
                    }`}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className={`mr-3 ${isActive ? 'text-dark-accent' : 'text-dark-muted'}`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border space-y-3 mt-auto">

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-dark-secondary hover:bg-light/50 dark:hover:bg-dark-border/50 hover:text-primary dark:hover:text-dark-primary rounded-lg transition-colors"
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </button>
        <p className="text-xs text-dark-muted text-center">
          Digital Twin System v1.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
