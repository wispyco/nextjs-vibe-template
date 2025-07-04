'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function AuthErrorPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md p-8 rounded-xl shadow-xl text-center ${
          theme === 'dark' 
            ? 'bg-gray-900 text-white' 
            : 'bg-white text-gray-900'
        }`}
      >
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          There was an error during the authentication process. Please try again.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className={`block w-full py-3 px-4 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            Try Again
          </Link>

          <Link
            href="/"
            className={`block w-full py-3 px-4 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}