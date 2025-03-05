"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaMicrophone } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";

interface PromptInputProps {
  isOpen: boolean;
  onSubmit: (prompt: string, isUpdate?: boolean) => void;
  isUpdateMode?: boolean;
  currentCode?: string;
}

export default function PromptInput({
  onSubmit,
  isUpdateMode = false,
  currentCode = "",
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt, isUpdateMode);
      setPrompt("");
    }
  };

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[600px] z-50"
    >
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer z-50 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <FaMicrophone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isUpdateMode
                  ? "Describe how to update the code..."
                  : "Type your prompt..."
              }
              className={`w-full backdrop-blur-xl border-2 rounded-lg pl-10 pr-4 py-2.5 text-sm shadow-xl transition-all ${
                theme === "dark"
                  ? "bg-gray-900/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  : "bg-white/80 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-blue-500/30 focus:ring-blue-500/20"
              } focus:outline-none focus:ring-2`}
            />
            <div
              className={`absolute inset-0 rounded-lg ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
                  : ""
              } pointer-events-none`}
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            {isUpdateMode ? "Update" : "Generate"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
