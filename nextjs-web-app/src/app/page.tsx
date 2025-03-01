"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
  FaTasks,
  FaBlog,
  FaUserTie,
  FaCalendarAlt,
  FaStore,
} from "react-icons/fa";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const examples = [
    {
      prompt:
        "A web app for creating a simple to-do list without user authentication",
      icon: <FaTasks className="w-4 h-4" />,
      label: "Simple To-Do List",
    },
    {
      prompt:
        "A web app for creating a simple blog with a list of posts, without user authentication",
      icon: <FaBlog className="w-4 h-4" />,
      label: "Simple Blog",
    },
    {
      prompt:
        "A web app for creating a simple portfolio with a list of projects, without user authentication",
      icon: <FaUserTie className="w-4 h-4" />,
      label: "Simple Portfolio",
    },
    {
      prompt:
        "A web app for creating a simple event calendar with a list of events, without user authentication",
      icon: <FaCalendarAlt className="w-4 h-4" />,
      label: "Simple Event Calendar",
    },
    {
      prompt:
        "A web app for generating a simple website for a small business, with a homepage, about page, and contact page, without user authentication",
      icon: <FaStore className="w-4 h-4" />,
      label: "Simple Website for Small Business",
    },
  ];
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!prompt) {
      setError("Please enter a prompt to generate web applications.");
      return;
    }

    setError(null);
    setIsLoading(true);
    router.push(`/results?prompt=${encodeURIComponent(prompt)}`);
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="relative z-10">
        <HeroGeometric badge="10x.Dev" title1="" title2="Faster Apps">
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative bg-[#1a1f2e]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-[#2a3040] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="relative p-6 z-10">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A to-do list app with local storage and dark mode"
                  className="w-full h-32 p-4 bg-[#1a1f2e]/50 font-sans text-base
                         border border-[#2a3040] rounded-xl mb-4 
                         focus:ring-2 focus:ring-[#3b82f6]/50 focus:border-transparent resize-none
                         placeholder:text-gray-400/70
                         text-gray-200"
                />

                <div className="flex flex-wrap gap-2 mb-4">
                  {examples.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example.prompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             bg-[#1a1f2e]/50 border border-[#2a3040] text-sm text-gray-300
                             hover:border-[#3b82f6]/50 transition-colors"
                    >
                      {example.icon}
                      {example.label}
                    </button>
                  ))}
                </div>

                <RainbowButton
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-lg font-medium"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  ) : null}
                  Generate Web Apps {!isLoading && <>+</>}
                </RainbowButton>
              </div>
            </div>
          </div>
        </HeroGeometric>
      </div>
    </div>
  );
}
