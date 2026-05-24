'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services';
import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="waves" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M0 5 Q2.5 0, 5 5 T10 5" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#waves)" />
            </svg>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <div className="mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                <CheckCircleIcon className="h-20 w-20 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-4">Email Sent!</h1>
            <p className="text-xl text-emerald-100 text-center max-w-md">
              Check your inbox for the password reset link.
            </p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center bg-emerald-500 p-4 rounded-2xl mb-4">
                <CheckCircleIcon className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-5 rounded-full">
                  <CheckCircleIcon className="h-14 w-14 text-emerald-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We&apos;ve sent a password reset link to:
              </p>
              <div className="bg-gray-50 rounded-xl py-3 px-4 mb-6">
                <p className="font-semibold text-gray-900">{email}</p>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full py-3 px-4 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                >
                  Try Different Email
                </button>
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-200 flex items-center justify-center"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Login
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Mount Zion Chapel. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="keys" width="15" height="15" patternUnits="userSpaceOnUse">
                <rect x="5" y="3" width="5" height="9" rx="1" fill="none" stroke="white" strokeWidth="0.5" />
                <rect x="3" y="9" width="9" height="3" rx="1" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#keys)" />
          </svg>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <BuildingLibraryIcon className="h-20 w-20 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">Forgot Password?</h1>
          <p className="text-xl text-orange-100 text-center max-w-md mb-8">
            No worries! We&apos;ll help you reset your password and get back to your account.
          </p>

          {/* Steps */}
          <div className="space-y-4 text-orange-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">
                1
              </div>
              <span>Enter your email address</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">
                2
              </div>
              <span>Check your inbox for the reset link</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">
                3
              </div>
              <span>Create a new secure password</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center bg-orange-500 p-4 rounded-2xl mb-4">
              <BuildingLibraryIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-full">
                  <EnvelopeIcon className="h-10 w-10 text-orange-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
              <p className="text-gray-500 mt-2">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Remember your password?</span>
              </div>
            </div>

            {/* Back to Login */}
            <Link
              href="/login"
              className="w-full py-3 px-4 border-2 border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Login
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Mount Zion Chapel. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
