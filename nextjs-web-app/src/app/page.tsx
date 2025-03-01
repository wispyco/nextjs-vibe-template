"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Hero } from "@/components/ui/animated-hero";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = () => {
    if (!prompt) {
      setError("Please enter a prompt to generate web applications.");
      return;
    }

    setError(null);
    router.push(`/results?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="w-full max-w-3xl px-4"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
              🧪 4xDev - Web App Generator
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Generate four different web applications from a single prompt
              using Groq's LLama3-70B model.
            </p>
          </div>

          {/* <Hero /> */}

          <div className="bg-white/80 dark:bg-black/50 backdrop-blur-lg rounded-xl shadow-lg p-6 mx-auto">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A to-do list app with local storage and dark mode"
              className="w-full h-32 p-4 bg-white/50 dark:bg-black/30 backdrop-blur border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              🚀 Generate 4 Web Apps
            </button>
            {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
          </div>

          <footer className="mt-8 text-center text-gray-600 dark:text-gray-400">
            <p>Powered by Groq's LLama3-70B model</p>
          </footer>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}
