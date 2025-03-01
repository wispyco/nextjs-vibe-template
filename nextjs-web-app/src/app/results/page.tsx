'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import AppTile from '@/components/AppTile';
import CodePreviewPanel from '@/components/CodePreviewPanel';

export default function Results() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(true);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppIndex, setSelectedAppIndex] = useState(0);
  const [editedResults, setEditedResults] = useState<string[]>([]);

  const variations = [
    '',
    'Make it visually appealing and use a different framework than the other versions.',
    'Focus on simplicity and performance. Use minimal dependencies.',
    'Add some creative features that might not be explicitly mentioned in the prompt.'
  ];

  const appTitles = [
    'Standard Version',
    'Visual Focus',
    'Minimalist Version',
    'Creative Approach'
  ];

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (!prompt) {
      setError('No prompt provided');
      setIsGenerating(false);
      return;
    }

    const generateApps = async () => {
      const newResults: string[] = [];

      try {
        for (let i = 0; i < variations.length; i++) {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, variation: variations[i] }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate app ${i + 1}`);
          }

          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }

          newResults.push(data.code);
        }

        setResults(newResults);
        setEditedResults(newResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate applications');
      } finally {
        setIsGenerating(false);
      }
    };

    generateApps();
  }, [searchParams]);

  const handleCodeChange = (newCode: string) => {
    const newResults = [...editedResults];
    newResults[selectedAppIndex] = newCode;
    setEditedResults(newResults);
  };

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-screen p-4 md:p-8"
      >
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500"
            >
              Generated Web Apps
            </motion.h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              ← Back to Prompt
            </Link>
          </div>

          {isGenerating && (
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xl text-gray-600 dark:text-gray-300 flex items-center gap-3"
              >
                <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin" />
                Generating your applications...
              </motion.div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex-1 flex gap-8 min-h-0">
              {/* Left side - App tiles */}
              <div className="w-1/3 space-y-4 overflow-auto pr-4">
                {editedResults.map((code, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AppTile
                      title={appTitles[index]}
                      isSelected={selectedAppIndex === index}
                      onClick={() => setSelectedAppIndex(index)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Right side - Code preview panel */}
              <motion.div 
                className="w-2/3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CodePreviewPanel
                  code={editedResults[selectedAppIndex]}
                  title={appTitles[selectedAppIndex]}
                  onCodeChange={handleCodeChange}
                />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
