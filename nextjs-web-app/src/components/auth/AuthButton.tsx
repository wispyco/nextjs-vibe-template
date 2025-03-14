"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { AuthModal } from "./AuthModal";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export function AuthButton() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Use our new auth context instead of zustand store
  const { user, tokens, isLoading, syncTokensWithDB } = useAuth();

  // Set up a timeout to prevent getting stuck in loading state
  useEffect(() => {
    setLocalLoading(isLoading);
    
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        // If still loading after 5 seconds, force reset the loading state
        setLocalLoading(false);
        setLoadingTimedOut(true);
        console.warn("Auth loading timed out after 5 seconds");
      }, 5000);
    } else {
      setLoadingTimedOut(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Function to retry loading auth state
  const handleRetry = async () => {
    setLocalLoading(true);
    setLoadingTimedOut(false);
    
    try {
      // Try to sync with DB which will refresh auth state
      await syncTokensWithDB();
    } catch (error) {
      console.error("Failed to retry auth loading:", error);
    }
    
    // Set a new timeout for this retry attempt
    const retryTimeoutId = setTimeout(() => {
      setLocalLoading(false);
      setLoadingTimedOut(true);
    }, 5000);
    
    return () => clearTimeout(retryTimeoutId);
  };

  // User is still loading (but with timeout protection)
  if (localLoading) {
    return (
      <div
        className={`py-2 px-4 rounded-lg text-sm font-medium ${
          theme === "dark"
            ? "bg-gray-800 text-gray-300"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        Loading...
      </div>
    );
  }

  // Loading timed out, show login/signup buttons with a retry option
  if (loadingTimedOut) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoginModal(true)}
            data-login-button="true"
            className={`py-2 px-4 rounded-lg text-sm font-medium ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setShowSignupModal(true)}
            data-signup-button="true"
            className={`py-2 px-4 rounded-lg text-sm font-medium ${
              theme === "dark"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={handleRetry}
            className={`ml-2 p-1 rounded-full ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-300 hover:bg-gray-400 text-gray-700"
            }`}
            title="Retry loading auth state"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mode="login"
        />

        <AuthModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          mode="signup"
        />
      </>
    );
  }

  // User is logged in
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span
            className={`flex text-xs ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {tokens} 
            <Image src="/coin.png" alt="Credits" width={16} height={16} className="ml-1"/>
          </span>
        </div>

        {pathname === "/dashboard" ? (
          <button
            onClick={() => router.push("/")}
            className={`py-2 px-4 rounded-lg text-sm font-medium ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Home
          </button>
        ) : (
          <button
            onClick={() => router.push("/dashboard")}
            className={`py-2 px-4 rounded-lg text-sm font-medium ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Dashboard
          </button>
        )}
      </div>
    );
  }

  // User is not logged in
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowLoginModal(true)}
          data-login-button="true"
          className={`py-2 px-4 rounded-lg text-sm font-medium ${
            theme === "dark"
              ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => setShowSignupModal(true)}
          data-signup-button="true"
          className={`py-2 px-4 rounded-lg text-sm font-medium ${
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
          }`}
        >
          Sign Up
        </button>
      </div>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode="login"
      />

      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
      />
    </>
  );
}
