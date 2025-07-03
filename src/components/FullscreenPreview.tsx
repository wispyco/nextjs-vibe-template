'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';

interface FullscreenPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title: string;
  theme: "light" | "dark";
}

const FullscreenOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
`;

const FullscreenContainer = styled(motion.div)<{ theme: "light" | "dark" }>`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${(props) => (props.theme === "dark" ? "#1a1b1e" : "#ffffff")};
`;

const Header = styled.div<{ theme: "light" | "dark" }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: ${(props) => (props.theme === "dark" ? "#2c2e33" : "#f8f9fa")};
  border-bottom: 1px solid ${(props) => (props.theme === "dark" ? "#373a40" : "#e9ecef")};
  min-height: 60px;
`;

const Title = styled.h2<{ theme: "light" | "dark" }>`
  color: ${(props) => (props.theme === "dark" ? "#ffffff" : "#000000")};
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
`;

const BackButton = styled(motion.button)<{ theme: "light" | "dark" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${(props) => (props.theme === "dark" ? "#4a5568" : "#e2e8f0")};
  color: ${(props) => (props.theme === "dark" ? "#ffffff" : "#2d3748")};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.theme === "dark" ? "#5a6578" : "#cbd5e0")};
    transform: translateX(-2px);
  }
`;

const CloseButton = styled(motion.button)<{ theme: "light" | "dark" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${(props) => (props.theme === "dark" ? "#4a5568" : "#e2e8f0")};
  color: ${(props) => (props.theme === "dark" ? "#ffffff" : "#2d3748")};
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.theme === "dark" ? "#e53e3e" : "#fed7d7")};
    color: ${(props) => (props.theme === "dark" ? "#ffffff" : "#c53030")};
    transform: scale(1.1);
  }
`;

const PreviewContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
`;

export default function FullscreenPreview({
  isOpen,
  onClose,
  code,
  title,
  theme
}: FullscreenPreviewProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FullscreenOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FullscreenContainer
            theme={theme}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Header theme={theme}>
              <BackButton
                theme={theme}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft />
                Back
              </BackButton>
              
              <Title theme={theme}>{title} - Fullscreen Preview</Title>
              
              <CloseButton
                theme={theme}
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </CloseButton>
            </Header>
            
            <PreviewContainer>
              <PreviewFrame
                srcDoc={code}
                title="Fullscreen Preview"
              />
            </PreviewContainer>
          </FullscreenContainer>
        </FullscreenOverlay>
      )}
    </AnimatePresence>
  );
}
