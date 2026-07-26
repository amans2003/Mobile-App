import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page - Enterprise Admin & HR Portal Authentication
 * Featuring 1-Click Quick Fill buttons and interactive show/hide password toggle (Eye open/close)
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (targetEmail, targetPassword) => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Login Card Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl mb-4 text-2xl font-black text-white">
            👑
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            Enterprise <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">HRIS</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Admin & HR Management Portal</p>
        </div>

        {/* Main Form Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-xs mb-6">Select your management role or sign in below</p>

          {/* ⚡ Quick-Select Management Roles */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              ⚡ Quick Role Access (Two Authorized Portals)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Super Admin Quick Btn */}
              <button
                type="button"
                onClick={() => fillCredentials('admin@company.com', 'admin123')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  email === 'admin@company.com'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <span className="block text-base mb-1">👑</span>
                <p className="text-xs font-bold text-gray-900">Super Admin</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Full System Access</p>
              </button>

              {/* HR Manager Quick Btn */}
              <button
                type="button"
                onClick={() => fillCredentials('hr@company.com', 'hr123')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  email === 'hr@company.com'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <span className="block text-base mb-1">👥</span>
                <p className="text-xs font-bold text-gray-900">HR Manager</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Staff & Payroll Portal</p>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl p-3.5 mb-5 flex items-center gap-2" id="login-error">
              <span>⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                Management Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-sm font-medium text-gray-900 bg-gray-50/50"
                placeholder="admin@company.com or hr@company.com"
              />
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-sm font-medium text-gray-900 bg-gray-50/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? (
                    /* Eye Off Icon */
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    /* Eye Open Icon */
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="btn-login"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-95 transition-all duration-200 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                'Launch Portal ➔'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6 font-medium">
          © 2026 Enterprise HRIS. Restricted strictly to Admin and HR Management.
        </p>
      </div>
    </div>
  );
};

export default Login;
