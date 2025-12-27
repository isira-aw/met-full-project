import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { LoadingSpinner } from './UI/LoadingSpinner';

export const ResetPasswordComponent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(''), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    setIsVerifying(true);
    try {
      const response = await apiService.verifyResetToken(token!);
      setTokenValid(response.status);
      if (!response.status) {
        setError('Invalid or expired reset token. Please request a new password reset.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError('Failed to verify reset token. Please try again.');
      setTokenValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePasswords = (): string | null => {
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword) {
      return 'New password is required';
    }

    if (newPassword.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (newPassword.length > 20) {
      return 'Password must be less than 20 characters';
    }

    if (!confirmPassword) {
      return 'Please confirm your password';
    }

    if (newPassword !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    
    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.resetPassword({
        token: token!,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      });

      if (response.status) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.response?.status === 400) {
        setError('Invalid request. Please check your input and try again.');
      } else if (err.response?.status === 404) {
        setError('Reset token not found. Please request a new password reset.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    if (error && showError) {
      setShowError(false);
      setTimeout(() => setError(''), 300);
    }
  };

  const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCloseError = () => {
    setShowError(false);
    setTimeout(() => setError(''), 300);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2 mt-4">Verifying Reset Token</h2>
          <p className="text-slate-600">Please wait while we verify your reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid Reset Link</h2>
          <p className="text-slate-600 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Password Reset Successful</h2>
          <p className="text-slate-600 mb-6">
            Your password has been successfully reset. You can now login with your new password.
          </p>
          <p className="text-sm text-slate-500">
            Redirecting to login page in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Your Password</h2>
          <p className="text-slate-600">Enter your new password below</p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className={`mb-6 transition-all duration-300 ease-in-out ${
              showError
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform -translate-y-2'
            }`}
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={handleCloseError}
                  className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                  aria-label="Close error message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                id="newPassword"
                value={passwords.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  error ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Enter new password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('newPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
                aria-label={showPasswords.newPassword ? 'Hide password' : 'Show password'}
              >
                {showPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={passwords.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  error ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Confirm new password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
                aria-label={showPasswords.confirmPassword ? 'Hide password' : 'Show password'}
              >
                {showPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Must be between 6-20 characters
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword === passwords.confirmPassword && passwords.newPassword ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Both passwords must match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleBackToLogin}
            disabled={isLoading}
            className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};