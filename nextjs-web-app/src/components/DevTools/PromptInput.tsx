"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaBolt, FaMinus, FaPlus } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { SignupModal } from "@/components/SignupModal";
import Image from "next/image";
import { MIN_NUM_GENERATIONS, MAX_NUM_GENERATIONS } from "@/context/GenerationsContext";

interface PromptInputProps {
  isOpen: boolean;
  onSubmit: (prompt: string, isUpdate?: boolean, chaosMode?: boolean, customNumGenerations?: number) => Promise<Record<string, unknown> | void> | void;
  isUpdateMode?: boolean;
  numGenerations?: number;
  initialStyle?: string | null;
  onNumGenerationsChange?: (num: number) => void;
}

export default function PromptInput({
  onSubmit,
  isUpdateMode = false,
  numGenerations = 1,
  initialStyle = null,
  onNumGenerationsChange,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [chaosMode, setChaosMode] = useState(true);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [customNumGenerations, setCustomNumGenerations] = useState(numGenerations);
  const { theme } = useTheme();

  // Update customNumGenerations when numGenerations prop changes
  useEffect(() => {
    setCustomNumGenerations(numGenerations);
  }, [numGenerations]);

  // If initialStyle is provided, append it to the prompt placeholder
  const getPlaceholder = () => {
    if (initialStyle) {
      return `Describe your web app idea... (Style: ${initialStyle})`;
    }
    return "Describe your web app idea...";
  };

  // Calculate cost based on model and number of generations
  const calculateCost = () => {
    // If in chaos mode, we're updating all generations
    // If in single mode, we're only updating one generation
    return chaosMode ? customNumGenerations : 1;
  };

  // Handle increment/decrement of generations
  const incrementGenerations = () => {
    if (customNumGenerations < MAX_NUM_GENERATIONS) {
      const newValue = customNumGenerations + 1;
      setCustomNumGenerations(newValue);
      if (onNumGenerationsChange) {
        onNumGenerationsChange(newValue);
      }
    }
  };

  const decrementGenerations = () => {
    if (customNumGenerations > MIN_NUM_GENERATIONS) {
      const newValue = customNumGenerations - 1;
      setCustomNumGenerations(newValue);
      if (onNumGenerationsChange) {
        onNumGenerationsChange(newValue);
      }
    }
  };

  // Handle direct input of generations
  const handleGenerationsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      const boundedValue = Math.min(MAX_NUM_GENERATIONS, Math.max(MIN_NUM_GENERATIONS, value));
      setCustomNumGenerations(boundedValue);
      if (onNumGenerationsChange) {
        onNumGenerationsChange(boundedValue);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      try {
        const result = await onSubmit(prompt, isUpdateMode, chaosMode, customNumGenerations);
        setPrompt("");

        // If onSubmit returns a value with an error property
        if (result && typeof result === 'object' && 'error' in result) {
          if (result.error === 'rate_limit_exceeded') {
            setShowSignupModal(true);
            return;
          }
        }
      } catch (error: unknown) {
        console.error("Error submitting prompt:", error);

        // Check for rate limit error in the caught exception
        const err = error as { error?: string, response?: { status: number }, message?: string };
        if (err?.error === 'rate_limit_exceeded' ||
            (err.response && err.response.status === 429) ||
            (err.message && err.message.includes('rate limit'))) {
          setShowSignupModal(true);
          return;
        }
      }
    }
  };

  return (
    <>
      {showSignupModal && (
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
        />
      )}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 sm:bottom-8 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] max-w-full z-50"
      >
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
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
              placeholder={getPlaceholder()}
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
          <div className="flex gap-2 sm:flex-shrink-0">
            {/* Number of generations control */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <button
                type="button"
                onClick={decrementGenerations}
                disabled={customNumGenerations <= MIN_NUM_GENERATIONS}
                className={`p-1 rounded ${customNumGenerations <= MIN_NUM_GENERATIONS ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                title="Decrease number of generations"
              >
                <FaMinus className="w-3 h-3 text-gray-400" />
              </button>
              <input
                type="number"
                min={MIN_NUM_GENERATIONS}
                max={MAX_NUM_GENERATIONS}
                value={customNumGenerations}
                onChange={handleGenerationsInputChange}
                className="w-10 bg-transparent text-center text-white text-sm border-none focus:ring-0 focus:outline-none"
                title="Number of generations"
              />
              <button
                type="button"
                onClick={incrementGenerations}
                disabled={customNumGenerations >= MAX_NUM_GENERATIONS}
                className={`p-1 rounded ${customNumGenerations >= MAX_NUM_GENERATIONS ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                title="Increase number of generations"
              >
                <FaPlus className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setChaosMode(!chaosMode)}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                chaosMode
                  ? theme === "dark"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title={chaosMode ? "Chaos Mode: Update all renders" : "Normal Mode: Update selected render only"}
            >
              <FaBolt className={`w-3 h-3 ${chaosMode ? "text-yellow-300" : ""}`} />
              <span className="hidden sm:inline">{chaosMode ? "Chaos" : "Single"}</span>
            </button>
            <button
              type="submit"
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                theme === "dark"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
            >
              <span>{isUpdateMode ? "Update" : "Generate"}</span>
              <span className="ml-2 flex items-center">
                <Image src="/coin.png" alt="Credits" width={16} height={16} className="mr-1" />
                {calculateCost()}
              </span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
    </>
  );
}
