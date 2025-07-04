"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone } from "react-icons/fa";
import styled from "styled-components";

// Type declarations for Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognition = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionEvent = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionErrorEvent = any;

const VoiceButton = styled(motion.button)`
  position: fixed;
  left: 20px;
  bottom: 60px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a202c;
  border: 2px solid rgba(75, 85, 99, 0.2);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(75, 85, 99, 0.2);
    transform: scale(1.05);
  }

  &[data-listening="true"] {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    .icon {
      color: rgb(34, 197, 94) !important;
    }
  }
`;

interface VoiceInputProps {
  onInput: (text: string) => void;
  theme: string;
}

export default function VoiceInput({ onInput, theme }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);

  const truncateFromStart = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return '...' + text.slice(-maxLength);
  };

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  // Initialize speech recognition only once
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as unknown as any).SpeechRecognition || (window as unknown as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        setRecognition(recognitionInstance);
      } else {
        setIsVoiceSupported(false);
      }
    }
  }, []); // Empty dependency array - only run once

  // Handle recognition events in a separate effect
  useEffect(() => {
    if (!recognition) return;

    let currentTimeoutId: NodeJS.Timeout | null = null;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join("");

      setTranscript(currentTranscript);

      // Clear existing timeout
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
      }

      // Set new timeout
      currentTimeoutId = setTimeout(() => {
        if (currentTranscript.trim()) {
          onInput(currentTranscript);
          setTranscript("");
        }
      }, 5000);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsVoiceSupported(false);
      }
      setIsListening(false);
      setTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      // Cleanup timeout
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
      }
      // Cleanup speech recognition
      if (recognition) {
        recognition.stop();
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
  }, [recognition, onInput]);

  const toggleListening = () => {
    if (!recognition || !isVoiceSupported) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (recognition && isVoiceSupported) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setIsVoiceSupported(false);
      }
    }
  };

  // Removed clearTranscript function as it's no longer needed

  return (
    <>
      <VoiceButton
        onClick={toggleListening}
        data-listening={isListening}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          cursor: isVoiceSupported ? 'pointer' : 'not-allowed',
          opacity: isVoiceSupported ? 1 : 0.5 
        }}
      >
        <FaMicrophone
          className={`w-5 h-5 icon ${
            !isVoiceSupported
              ? "text-gray-400"
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        />
      </VoiceButton>
      <AnimatePresence mode="wait">
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div
              className={`p-3 rounded-lg shadow-lg mx-auto ${
                theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
              }`}
            >
              <p className="text-center" style={{ direction: 'rtl', textAlign: 'left' }}>
                {transcript ? truncateFromStart(transcript, 75) : "Listening..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
