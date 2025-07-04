'use client';

import { memo, useState, useEffect } from 'react';

interface IsolatedCodePreviewProps {
  code: string;
  showControls?: boolean;
  theme: "light" | "dark";
}

// Completely isolated preview component that doesn't trigger parent updates
const IsolatedCodePreview = memo(function IsolatedCodePreview({ 
  code, 
  showControls = false,
  theme 
}: IsolatedCodePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  
  // Only update iframe when code actually changes
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [code]);

  return (
    <div className="h-full w-full">
      <iframe
        key={iframeKey}
        srcDoc={code || ''}
        className="w-full h-full border-0 bg-white"
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
});

export default IsolatedCodePreview;