import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 🌟 useLocation එකතු කළා
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, Loader2, ArrowRight, User, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 🌟 මෙතනට location එක ගත්තා

  // 🌟 Navigation ලොජික් එක වෙන් කර ගත්තා (තැන් දෙකේම පාවිච්චි කරන්න ලේසි වෙන්න)
  const handleSuccessfulLogin = (userData: any) => {
      login(userData);
      
      const role = userData.user?.role || userData.role; // Backend response එක අනුව role එක ගැනීම

      if (role === 'admin') {
          navigate('/admin'); // Admin කෙනෙක් නම් Admin Panel එකට යවන්න
      } else {
          // Protected route එකකින් ආවා නම් ඒ අදාළ පිටුවට යවන්න (location.state.from)
          // එහෙම නැත්නම් කෙලින්ම කලින් හිටපු පිටුවට යවන්න (navigate(-1))
          const from = location.state?.from?.pathname || location.state?.from;
          if (from) {
              navigate(from, { replace: true });
          } else {
              navigate(-1); // 🌟 මේකෙන් කෙලින්ම browser එකේ Back button එක එබුවා වගේ කලින් පිටුවට යනවා
          }
      }
  };

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

            // 🌟 අලුත් Navigation එක Call කිරීම
            handleSuccessfulLogin(data);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (isLogin) {
        // 🌟 අලුත් Navigation එක Call කිරීම
        handleSuccessfulLogin(data);
      } else {
        alert('Account created successfully! Please log in.');
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' }));
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-emerald-100">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2">
            {isLogin ? 'Sign in to manage your trips' : 'Start your journey with LankaVibe'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 sm:mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          
          {!isLogin && (
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Full Name</label>
                <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm sm:text-base"
                    placeholder="John Doe"
                    required
                />
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm sm:text-base"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-12 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm sm:text-base [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                placeholder="••••••••"
                required
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'} 
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
            )}
          </button>
          
          {/* Add Google Button */}
            <div className="mt-6">
                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>
                <div className="flex justify-center w-full">
                     <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        width="300" 
                     />
                </div>
            </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setShowPassword(false);
            }} 
            className="text-emerald-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;