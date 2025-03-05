"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // This is a placeholder for actual signup logic
    // In a real app, you would call your authentication API here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, just redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="name" 
              className={`block mb-1 text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`w-full p-2.5 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
          
          <div>
            <label 
              htmlFor="email" 
              className={`block mb-1 text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full p-2.5 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
          
          <div>
            <label 
              htmlFor="password" 
              className={`block mb-1 text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={`w-full p-2.5 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
          
          <div className="pt-2">
            <RainbowButton
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : null}
              Create Account
            </RainbowButton>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className={`font-medium ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              } hover:underline`}
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
