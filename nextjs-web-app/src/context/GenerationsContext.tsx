"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define the default and minimum number of generations
export const DEFAULT_NUM_GENERATIONS = 4;
export const MIN_NUM_GENERATIONS = 1;

interface GenerationsContextType {
  numGenerations: number;
  setNumGenerations: (num: number) => void;
  incrementGenerations: () => void;
  decrementGenerations: () => void;
}

const GenerationsContext = createContext<GenerationsContextType | undefined>(undefined);

export function GenerationsProvider({ children }: { children: ReactNode }) {
  const [numGenerations, setNumGenerationsState] = useState<number>(DEFAULT_NUM_GENERATIONS);

  // Initialize from localStorage if available
  useEffect(() => {
    const storedValue = localStorage.getItem('numGenerations');
    if (storedValue) {
      const parsedValue = parseInt(storedValue, 10);
      if (!isNaN(parsedValue) && parsedValue >= MIN_NUM_GENERATIONS) {
        setNumGenerationsState(parsedValue);
      }
    }
  }, []);

  // Update localStorage when value changes
  useEffect(() => {
    localStorage.setItem('numGenerations', numGenerations.toString());
  }, [numGenerations]);

  const setNumGenerations = (num: number) => {
    // Ensure the number is at least the minimum
    const boundedNum = Math.max(MIN_NUM_GENERATIONS, num);
    setNumGenerationsState(boundedNum);
  };

  const incrementGenerations = () => {
    setNumGenerationsState(prev => prev + 1);
  };

  const decrementGenerations = () => {
    setNumGenerationsState(prev => 
      prev > MIN_NUM_GENERATIONS ? prev - 1 : prev
    );
  };

  return (
    <GenerationsContext.Provider 
      value={{ 
        numGenerations, 
        setNumGenerations, 
        incrementGenerations, 
        decrementGenerations 
      }}
    >
      {children}
    </GenerationsContext.Provider>
  );
}

export function useGenerations() {
  const context = useContext(GenerationsContext);
  if (context === undefined) {
    throw new Error("useGenerations must be used within a GenerationsProvider");
  }
  return context;
} 