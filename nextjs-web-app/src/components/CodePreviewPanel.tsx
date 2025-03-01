'use client';

import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface CodePreviewPanelProps {
  code: string;
  title: string;
  onCodeChange?: (newCode: string) => void;
}

export default function CodePreviewPanel({ code, title, onCodeChange }: CodePreviewPanelProps) {
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
      onCodeChange?.(value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'preview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'code'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Code
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full" key={previewKey}>
            <iframe
              srcDoc={editedCode}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        ) : (
          <div className="h-full w-full">
            <MonacoEditor
              height="100%"
              defaultLanguage="html"
              value={editedCode}
              onChange={handleCodeChange}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
