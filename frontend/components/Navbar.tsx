import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, UserCog, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal'; 

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false); // Close mobile menu on logout
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Packages', path: '/packages' },
    { name: 'AI Planner', path: '/planner' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-2xl font-extrabold bg-emerald-600 hover:bg-emerald-700 bg-clip-text text-transparent transition-all">
                LankaVibe
              </span>
            </Link>

            {/* Desktop Links & Actions - Hidden on Mobile */}
            {/* Added md:gap-4 lg:gap-8 to handle tablet sizing better */}
            <div className="hidden md:flex items-center md:gap-4 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive(link.path)
                      ? 'text-emerald-600 underline underline-offset-8'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-gray-700 truncate max-w-[150px]">
                    Hi, {user.name}
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`p-2 rounded-full transition-colors ${
                        isActive('/admin') 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title="Agency Admin"
                    >
                      <UserCog className="w-5 h-5" />
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-800 whitespace-nowrap px-2"
                >
                  Log In
                </button>
              )}

              <Link
                to="/planner"
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 whitespace-nowrap"
              >
                Plan Your Trip
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {/* Adjusted styling for full responsiveness and better UX */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl animate-in slide-in-from-top-5 duration-200">
             <div className="px-4 pt-4 pb-6 space-y-2">
                {navLinks.map(link => (
                    <Link 
                      key={link.path} 
                      to={link.path} 
                      onClick={() => setIsOpen(false)} 
                      className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                        isActive(link.path) 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {link.name}
                    </Link>
                ))}
                
                <hr className="my-2 border-gray-100" />

                {/* Mobile User Section */}
                <div className="px-2 space-y-3">
                  {user ? (
                    <>
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="font-bold text-gray-800">Hi, {user.name}</span>
                        {user.role === 'admin' && (
                          <Link 
                            to="/admin" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full"
                          >
                            <UserCog className="w-4 h-4" /> Admin
                          </Link>
                        )}
                      </div>
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setIsOpen(false); setShowAuthModal(true); }} 
                      className="w-full px-4 py-3 text-center text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      Log In
                    </button>
                  )}

                  {/* Mobile CTA Button */}
                  <Link
                    to="/planner"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
                  >
                    <Sparkles className="w-4 h-4" /> Plan Your Trip
                  </Link>
                </div>
             </div>
          </div>
        )}
      </nav>

      {/* Render the Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default Navbar;