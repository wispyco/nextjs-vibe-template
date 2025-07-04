'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  changes?: Array<{
    file: string;
    action: 'create' | 'update' | 'delete';
  }>;
}

interface AIChatInterfaceProps {
  projectId: string;
  projectName: string;
  onClose?: () => void;
  onChangesApplied?: (changes: any[]) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  enablePR?: boolean; // Enable pull request workflow
}

export default function AIChatInterface({
  projectId,
  projectName,
  onClose,
  onChangesApplied,
  isFullscreen = false,
  onToggleFullscreen,
  enablePR = true,
}: AIChatInterfaceProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [createPR, setCreatePR] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history
  useEffect(() => {
    loadConversationHistory();
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/ai-agent?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          // Load the most recent conversation
          const recentConversation = data.conversations[0];
          setConversationId(recentConversation.id);
          
          const loadedMessages: Message[] = recentConversation.ai_messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            changes: msg.metadata?.changes,
          }));
          
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message: userMessage.content,
          conversationId,
          clientType: 'web',
          createPR: createPR,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversation ID if this is a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        changes: data.changes,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Notify parent component about changes
      if (data.changes && data.changes.length > 0 && onChangesApplied) {
        onChangesApplied(data.changes);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`flex flex-col ${
        isFullscreen ? 'h-full' : 'h-[600px]'
      } ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-xl overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-500" />
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            AI Assistant - {projectName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Ask me to help you modify your Next.js project!
            </p>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Example: "Add a contact form to the homepage"
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
                }`}>
                  <Bot className="w-5 h-5 text-purple-500" />
                </div>
              )}
              
              <div className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-100'
                    : 'bg-white text-gray-900'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.changes && message.changes.length > 0 && (
                  <div className={`mt-2 pt-2 border-t ${
                    message.role === 'user'
                      ? 'border-blue-400'
                      : theme === 'dark'
                        ? 'border-gray-600'
                        : 'border-gray-200'
                  }`}>
                    <p className="text-sm font-medium mb-1">Changes made:</p>
                    <ul className="text-sm space-y-1">
                      {message.changes.map((change, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            change.action === 'create' ? 'bg-green-400' :
                            change.action === 'update' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`} />
                          <span className="font-mono">{change.file}</span>
                          <span className="text-xs opacity-75">({change.action})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-blue-200'
                    : theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
                }`}>
                  <User className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
            }`}>
              <Bot className="w-5 h-5 text-purple-500" />
            </div>
            <div className={`rounded-lg p-3 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-white'
            }`}>
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {enablePR && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="createPR"
              checked={createPR}
              onChange={(e) => setCreatePR(e.target.checked)}
              className="text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="createPR"
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Create pull request instead of direct commit
            </label>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to modify your project..."
            rows={1}
            disabled={isLoading}
            className={`flex-1 resize-none rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              theme === 'dark'
                ? 'bg-gray-700 text-white placeholder-gray-400'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500'
            } disabled:opacity-50`}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className={`text-xs mt-2 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}