import { useState } from 'react';

interface AppPreviewProps {
  title: string;
  code: string;
}

export default function AppPreview({ title, code }: AppPreviewProps) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-xl font-semibold text-blue-600 mb-4">{title}</h3>
      
      <button
        onClick={() => setIsCodeVisible(!isCodeVisible)}
        className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
      >
        {isCodeVisible ? 'Hide Code' : 'View Code'}
      </button>

      {isCodeVisible && (
        <div className="mb-4 overflow-auto max-h-[300px] rounded-md">
          <pre className="bg-gray-50 p-4 text-sm">
            <code>{code}</code>
          </pre>
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <iframe
          srcDoc={code}
          className="w-full h-[400px]"
          title={title}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
