"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function SignupPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Redirect to Google Form on component mount
  useEffect(() => {
    window.location.href = "https://docs.google.com/forms/d/e/1FAIpQLSdBUzzrsu74cJlRhZZVSQuYAcGZ4_8RKB-G7vYZGibU7S5T4g/viewform?usp=header";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md p-8 rounded-xl shadow-xl ${
          theme === "dark" 
            ? "bg-gray-900 text-white" 
            : "bg-white text-gray-900"
        }`}
      >
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center">
            Redirecting you to our signup form...
          </p>
          <div className="w-8 h-8 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin"></div>
          <p className="text-sm text-center">
            If you are not redirected automatically, please click the button below:
          </p>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdBUzzrsu74cJlRhZZVSQuYAcGZ4_8RKB-G7vYZGibU7S5T4g/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2 px-4 rounded-lg font-medium text-center ${
              theme === "dark" 
                ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            Go to Signup Form
          </a>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
