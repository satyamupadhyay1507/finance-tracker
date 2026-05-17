import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// navbar component
function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
  ];

  if (isAdmin()) {
    navLinks.push({ path: '/admin', label: 'Users' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300 shadow-sm"
      id="main-navbar"
    >
      {/* logo and mobile toggle */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-black tracking-tighter no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">FT</div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">FinTrack</span>
        </Link>
        <button 
          className="md:hidden text-2xl cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          id="mobile-menu-toggle"
        >
          {mobileMenuOpen ? 'X' : '='}
        </button>
      </div>

      {/* nav links */}
      <div className={`flex gap-2 ${mobileMenuOpen ? 'flex flex-col w-full mt-4' : 'hidden md:flex'}`}>
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 no-underline ${
              isActive(link.path) 
                ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* right side actions */}
      <div className={`flex items-center gap-4 ${mobileMenuOpen ? 'flex flex-wrap w-full mt-4 justify-between border-t border-gray-200 dark:border-gray-700 pt-4' : 'hidden md:flex'}`}>
        <button 
          className="text-sm p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm text-gray-700 dark:text-gray-300 font-medium"
          onClick={toggleTheme} 
          title="Toggle theme"
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name}</span>
            <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
              user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
              user?.role === 'user' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
            }`}>
              {user?.role}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border-2 border-white dark:border-gray-800 shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        <button 
          className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-rose-500 hover:text-white shadow-sm hover:shadow-rose-500/30"
          onClick={handleLogout}
          id="logout-btn"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
