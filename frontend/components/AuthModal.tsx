import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  // view state: 'login' | 'register' | 'forgot'
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      login(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Login Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Determine Endpoint based on view
    let endpoint = '';
    let body = {};

    if (view === 'login') {
      endpoint = '/api/auth/login';
      body = { email: formData.email, password: formData.password };
    } else if (view === 'register') {
      endpoint = '/api/auth/register';
      body = formData;
    } else if (view === 'forgot') {
      endpoint = '/api/auth/forgot-password';
      body = { email: formData.email };
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (view === 'login') {
        login(data);
        onClose();
      } else if (view === 'register') {
        alert('Account created! Please log in.');
        setView('login');
      } else if (view === 'forgot') {
        setSuccessMsg('Password reset link sent! Check your email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to reset state when switching views
  const switchView = (newView: 'login' | 'register' | 'forgot') => {
    setView(newView);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header Section */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Join LankaVibe'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-gray-500">
            {view === 'login' && 'Log in to manage your trips.'}
            {view === 'register' && 'Create an account to start planning.'}
            {view === 'forgot' && 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none border border-gray-100"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none border border-gray-100"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {view !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none border border-gray-100"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          )}

          {/* Forgot Password Link (Only in Login View) */}
          {view === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="text-sm text-emerald-600 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-200">
            {loading ? <Loader2 className="animate-spin" /> : (
              view === 'login' ? 'Log In' :
                view === 'register' ? 'Create Account' : 'Send Reset Link'
            )}
          </button>
          {/* ADD GOOGLE BUTTON HERE */}
          {(view === 'login' || view === 'register') && (
            <div className="mt-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  useOneTap
                  theme="outline"
                  shape="circle"
                  width="100%"
                />
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {view === 'forgot' ? (
            <button
              onClick={() => switchView('login')}
              className="text-gray-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          ) : (
            <>
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchView(view === 'login' ? 'register' : 'login')}
                className="text-emerald-600 font-bold hover:underline"
              >
                {view === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;