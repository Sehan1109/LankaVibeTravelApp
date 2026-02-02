import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams(); // Capture token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Password reset successful!' });
      setTimeout(() => navigate('/'), 3000); // Redirect to home/login after 3s
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return ( 
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4 sm:p-6">
      
      {/* Inner Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
        
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Set New Password</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2">Please enter your new password below.</p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 text-center font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {message.type !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="New Password"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Confirm Password"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
                disabled={loading} 
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex justify-center text-sm sm:text-base"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}
        
        {message.type === 'success' && (
             <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Redirecting to login...</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;