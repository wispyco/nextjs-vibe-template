'use client';

import { useEffect, useState } from 'react';

interface CodePreviewPanelProps {
  code: string;
  onChange?: (newCode: string) => void;
  isLoading?: boolean;
  theme?: "light" | "dark";
}

export default function CodePreviewPanel({ 
  code, 
  onChange,
  isLoading = false,
  theme = "dark"
}: CodePreviewPanelProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setEditedCode(code);
  }, [code]);

  return (
    <div className="h-full w-full overflow-hidden flex items-center justify-center">
      <div className="transform scale-[0.6] w-[166%] h-[166%] origin-center">
        <iframe
          srcDoc={editedCode}
          className="w-full h-full border-0 bg-white"
          title="Preview"
        />
      </div>
    </div>
  );
}
