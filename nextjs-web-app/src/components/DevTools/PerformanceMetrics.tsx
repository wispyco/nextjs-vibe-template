"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaKeyboard, FaTimes, FaChartLine } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";

interface PerformanceMetricsProps {
  isOpen: boolean;
  onClose: () => void;
  generationTimes: { [key: number]: number };
}

function getSpeedColor(time: number, fastestTime: number) {
  const ratio = fastestTime / time;
  if (ratio > 0.9) return "stroke-emerald-500"; // Very fast (90-100% of fastest)
  if (ratio > 0.7) return "stroke-blue-500"; // Fast (70-90% of fastest)
  if (ratio > 0.5) return "stroke-yellow-500"; // Medium (50-70% of fastest)
  return "stroke-orange-500"; // Slower (< 50% of fastest)
}

function getSpeedLabel(time: number, fastestTime: number) {
  const ratio = fastestTime / time;
  if (ratio > 0.9)
    return { text: "Blazing Fast ⚡", color: "text-emerald-500" };
  if (ratio > 0.7) return { text: "Quick 🚀", color: "text-blue-500" };
  if (ratio > 0.5) return { text: "Good Speed 👍", color: "text-yellow-500" };
  return { text: "Standard ⚙️", color: "text-orange-500" };
}

const appNames = [
  "Standard Version",
  "Visual Focus",
  "Minimalist Version",
  "Creative Approach",
  "Enhanced Version",
];

const frameworkNames = [
  "Material UI",
  "Chakra UI",
  "CSS Modules",
  "Styled Components + Framer Motion",
  "Bulma",
];

export default function PerformanceMetrics({
  isOpen,
  onClose,
  generationTimes,
}: PerformanceMetricsProps) {
  const { theme } = useTheme();
  const times = Object.values(generationTimes);
  const averageTime =
    times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-0 right-0 bottom-0 w-80 backdrop-blur-xl border-l-2 shadow-2xl overflow-hidden z-50 ${
            theme === "dark"
              ? "bg-gray-900/40 border-gray-700/50"
              : "bg-white/80 border-gray-200/50"
          }`}
        >
          <div className="relative">
            {theme === "dark" && (
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
            )}
          </div>
          <div className="h-full flex flex-col relative">
            <div
              className={`flex items-center justify-between p-4 border-b-2 ${
                theme === "dark"
                  ? "bg-gray-900/40 border-gray-700/50"
                  : "bg-white/80 border-gray-200/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaChartLine
                  className={
                    theme === "dark" ? "text-blue-400" : "text-blue-500"
                  }
                />
                <h2
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Performance Metrics
                </h2>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FaKeyboard className="w-3 h-3" />
                  <span className="font-mono">Shift + P</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Average Generation Time */}
              <div className="p-4 rounded-xl bg-gray-800/80">
                <div className="flex items-start gap-4">
                  {/* Left side - Circle */}
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-gray-700"
                        strokeWidth="6"
                        fill="none"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-blue-500"
                        strokeWidth="6"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 0.75 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xl font-medium text-white">
                        {averageTime.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">seconds</div>
                    </div>
                  </div>

                  {/* Right side - Stats */}
                  <div className="flex-1 space-y-2">
                    <div className="text-gray-400 text-sm">
                      Average Generation
                      <div className="text-gray-400">Time</div>
                    </div>

                    <div className="inline-block px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm">
                      {Object.keys(generationTimes).length} Apps Generated
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-gray-900/50">
                        <div className="text-gray-400 text-xs">Fastest</div>
                        <div className="text-emerald-400 text-sm">
                          {Math.min(...times).toFixed(1)}s
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-900/50">
                        <div className="text-gray-400 text-xs">Slowest</div>
                        <div className="text-orange-400 text-sm">
                          {Math.max(...times).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Times */}
              <div className="space-y-2">
                {[
                  {
                    time: 5.9,
                    name: "Standard Version",
                    framework: "Material UI",
                    color: "emerald",
                  },
                  {
                    time: 7.6,
                    name: "Visual Focus",
                    framework: "Chakra UI",
                    color: "blue",
                  },
                  {
                    time: 7.9,
                    name: "Minimalist Version",
                    framework: "CSS Modules",
                    color: "blue",
                  },
                  {
                    time: 5.7,
                    name: "Creative Approach",
                    framework: "Styled Components + Framer Motion",
                    color: "emerald",
                  },
                  {
                    time: 9.7,
                    name: "Enhanced Version",
                    framework: "Bulma",
                    color: "yellow",
                  },
                ].map((item) => {
                  const speed = getSpeedLabel(item.time, Math.min(...times));
                  return (
                    <div
                      key={item.name}
                      className="p-3 rounded-lg bg-gray-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="21"
                              className="stroke-gray-700"
                              strokeWidth="4"
                              fill="none"
                            />
                            <motion.circle
                              cx="24"
                              cy="24"
                              r="21"
                              className={`stroke-${item.color}-500`}
                              strokeWidth="4"
                              fill="none"
                              initial={{ pathLength: 0 }}
                              animate={{
                                pathLength: Math.min(...times) / item.time,
                              }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-sm font-mono text-gray-300">
                              {item.time}s
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {item.framework}
                          </p>
                          <p className={`text-sm text-${item.color}-500`}>
                            {speed.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
