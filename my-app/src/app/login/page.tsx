'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setError, setLoading } from '@/store/slices/authSlice';
import { authService } from '@/services';
import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeOpenIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: 'admin@rccgmtzion.ca',
    password: 'adminCoven1$',
  });
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA challenge state
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [code, setCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    dispatch(setLoading(true));

    try {
      const result = await authService.login(formData);
      if ('twoFactorRequired' in result) {
        setChallengeToken(result.challengeToken);
        setTwoFactorEmail(result.email);
        setStep('2fa');
        return;
      }
      dispatch(setUser(result.user));
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setLocalError(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    try {
      const result = await authService.verifyTwoFactor(challengeToken, code.trim());
      dispatch(setUser(result.user));
      router.push('/dashboard');
    } catch (error: any) {
      setLocalError(error.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setLocalError('');
    try {
      await authService.resendTwoFactor(challengeToken);
      setLocalError('A new code has been sent.');
    } catch {
      setLocalError('Could not resend the code.');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full">
            {/* Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />

        {/* Floating Shapes */}
        <div className="absolute top-20 right-20 w-20 h-20 border border-white/20 rounded-2xl rotate-12" />
        <div className="absolute bottom-32 left-16 w-16 h-16 border border-white/20 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-white/10 rounded-lg rotate-45" />
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white/5 rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <BuildingLibraryIcon className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-3">Mount Zion Chapel</h1>
          <p className="text-lg text-blue-100 text-center max-w-sm mb-8">
            Manage your church operations efficiently
          </p>

          {/* Features List */}
          <div className="space-y-3 text-blue-100 text-sm">
            <div className="flex items-center">
              <ClipboardDocumentCheckIcon className="w-5 h-5 mr-3 text-blue-300" />
              <span>Member Check-in & Attendance</span>
            </div>
            <div className="flex items-center">
              <EnvelopeOpenIcon className="w-5 h-5 mr-3 text-blue-300" />
              <span>Email Communication</span>
            </div>
            <div className="flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-3 text-blue-300" />
              <span>Notes & Documentation</span>
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-3 text-blue-300" />
              <span>Ministry Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center bg-blue-600 p-3 rounded-2xl mb-3">
              <BuildingLibraryIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Mount Zion Chapel</h1>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === '2fa' ? 'Enter your code' : 'Welcome Back'}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                {step === '2fa'
                  ? `We sent a 6-digit code to ${twoFactorEmail}`
                  : 'Sign in to your account'}
              </p>
            </div>

            {/* Error Message */}
            {localError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{localError}</p>
              </div>
            )}

            {/* 2FA code step */}
            {step === '2fa' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setLocalError(''); }}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.4em] font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || code.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify & sign in'
                  )}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setStep('login'); setCode(''); setLocalError(''); }} className="text-gray-500 hover:text-gray-700">
                    Back
                  </button>
                  <button type="button" onClick={handleResend} className="text-blue-600 hover:text-blue-700 font-medium">
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* Login Form */}
            {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Mount Zion Chapel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
