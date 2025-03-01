'use client';

import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface CodePreviewPanelProps {
  code: string;
  title?: string;
  onChange?: (newCode: string) => void;
  isLoading?: boolean;
  theme: "light" | "dark";
  deployButton?: React.ReactNode;
}

export default function CodePreviewPanel({ 
  code, 
  title, 
  onChange, 
  isLoading = false,
  theme,
  deployButton
}: CodePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [editedCode, setEditedCode] = useState(code);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setEditedCode(code);
  }, [code]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedCode(value);
      setPreviewKey(prev => prev + 1);
      onChange?.(value);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <div>{deployButton}</div>
        <div className="space-x-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Code
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'preview' ? (
          <div key={previewKey} className="h-full">
            <iframe
              srcDoc={editedCode}
              className="w-full h-full border-0 bg-white"
              title="Preview"
            />
          </div>
        ) : (
          <div className="h-full">
            <MonacoEditor
              height="100%"
              defaultLanguage="html"
              theme={theme === 'dark' ? "vs-dark" : "light"}
              value={editedCode}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: isLoading,
                automaticLayout: true,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
