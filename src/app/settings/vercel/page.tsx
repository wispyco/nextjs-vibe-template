'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VercelSettingsContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/vercel/test');
      const data = await response.json();
      setIsConnected(data.success);
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/vercel';
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Vercel account?')) {
      try {
        const response = await fetch('/api/vercel/disconnect', { method: 'POST' });
        if (response.ok) {
          setIsConnected(false);
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Vercel Integration</h1>
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-500 rounded-lg">
          <p className="text-green-800 dark:text-green-200">
            ✅ Vercel integration connected successfully!
          </p>
        </div>
      )}
      
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          {isConnected ? 'Vercel Account Connected' : 'Deploy to Your Vercel Account'}
        </h2>
        
        {isConnected ? (
          <>
            <p className="text-muted-foreground mb-6">
              Your Vercel account is connected and ready to deploy projects.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/api/vercel/test'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white rounded transition-colors"
              >
                Test Connection
              </button>
              
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors ml-4"
              >
                Disconnect
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">
                Note: If the integration doesn't appear in your Vercel dashboard, it may have been connected 
                through a direct token. The integration still works for all API operations.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              Connect your Vercel account to deploy generated projects directly to your own infrastructure.
              This integration allows vibeweb.app to:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-8">
              <li>Create new projects in your Vercel account</li>
              <li>Deploy generated code automatically</li>
              <li>Monitor deployment status in real-time</li>
              <li>Manage environment variables and settings</li>
            </ul>

            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 rounded mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ If you see "invalid client_id" error, the integration needs to be installed through 
                the Vercel marketplace or your integration dashboard first.
              </p>
            </div>

            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 76 65"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
              </svg>
              Install Vercel Integration
            </button>
          </>
        )}
        
        <div className="mt-4">
          <a
            href="/settings/vercel/diagnostics"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Having issues? Run diagnostics →
          </a>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Privacy & Security</h3>
        <p className="text-sm text-muted-foreground">
          Your Vercel access token is encrypted and stored securely. We only request the minimum 
          permissions needed to deploy your projects. You can revoke access at any time from your 
          Vercel dashboard or by disconnecting the integration above.
        </p>
      </div>
    </div>
  );
}

export default function VercelSettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-2xl">Loading...</div>}>
      <VercelSettingsContent />
    </Suspense>
  );
}