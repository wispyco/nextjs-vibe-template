'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { signInWithGitHub } from '@/lib/supabase/auth-client';
import { useTheme } from '@/context/ThemeContext';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
      await signInWithGitHub(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in with GitHub. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md p-8 rounded-xl shadow-xl ${
          theme === 'dark' 
            ? 'bg-gray-900 text-white' 
            : 'bg-white text-gray-900'
        }`}
      >
        <h1 className="text-2xl font-bold mb-2 text-center">Welcome to vibeweb.app</h1>
        <p className={`text-center mb-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Sign in to create and deploy web applications with AI
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-lg font-medium transition-all ${
            theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaGithub className="text-xl" />
          {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
        </button>

        <p className={`text-sm text-center mt-6 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          By signing in, you agree to our terms of service.
        </p>

        <p className={`text-xs text-center mt-4 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
        }`}>
          We'll request access to create and manage repositories on your behalf.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}