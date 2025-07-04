'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VercelIntegrationProps {
  onIntegrationComplete?: () => void;
  className?: string;
}

export function VercelIntegration({ onIntegrationComplete, className }: VercelIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      // Check via API endpoint instead of direct server function
      const response = await fetch('/api/auth/vercel/status');
      if (response.ok) {
        const { connected } = await response.json();
        setIsConnected(connected);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to check Vercel integration status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Vercel OAuth flow
    window.location.href = '/api/auth/vercel';
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/vercel/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to disconnect Vercel integration:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Button disabled variant="outline">
          <div className="animate-pulse">Checking integration...</div>
        </Button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-muted-foreground">Vercel Integration Active</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-destructive hover:text-destructive"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={handleConnect}
        className="bg-black hover:bg-gray-800 text-white"
      >
        <svg
          className="w-4 h-4 mr-2"
          viewBox="0 0 76 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
        </svg>
        Install Vercel Integration
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Connect your Vercel account to deploy projects
      </p>
    </div>
  );
}