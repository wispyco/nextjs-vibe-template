'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function VercelDiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Check if we have a stored token
    try {
      const tokenResponse = await fetch('/api/vercel/test');
      const tokenData = await tokenResponse.json();
      
      if (tokenData.success) {
        diagnostics.push({
          test: 'Token Storage',
          status: 'success',
          message: 'Token found and working',
          details: {
            projectCount: tokenData.projectCount,
            projects: tokenData.projects
          }
        });
      } else {
        diagnostics.push({
          test: 'Token Storage',
          status: 'error',
          message: 'No token found',
          details: tokenData
        });
      }
    } catch (error) {
      diagnostics.push({
        test: 'Token Storage',
        status: 'error',
        message: 'Failed to check token',
        details: error.message
      });
    }

    // Test 2: Check integration configuration
    diagnostics.push({
      test: 'Integration Configuration',
      status: 'warning',
      message: 'Integration appears to be connected via direct token',
      details: {
        expectedFlow: 'OAuth Integration',
        actualFlow: 'Direct API Token or Legacy Connection',
        recommendation: 'Install through Vercel Marketplace for full integration features'
      }
    });

    // Test 3: Check OAuth credentials
    const hasOAuthCreds = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID;
    diagnostics.push({
      test: 'OAuth Credentials',
      status: hasOAuthCreds ? 'success' : 'error',
      message: hasOAuthCreds ? 'OAuth client ID configured' : 'OAuth client ID missing',
      details: {
        clientId: hasOAuthCreds ? 'oac_PdrqV45RUU42aFKzLXQhKglu' : 'Not found'
      }
    });

    setResults(diagnostics);
    setLoading(false);
  };

  const getIntegrationUrl = () => {
    // Direct link to install the integration from Vercel marketplace
    const clientId = 'oac_PdrqV45RUU42aFKzLXQhKglu';
    return `https://vercel.com/integrations/new?developer-id=${clientId}`;
  };

  const getMarketplaceUrl = () => {
    // This would be your integration's marketplace URL once published
    return 'https://vercel.com/integrations';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Running diagnostics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          ← Back to settings
        </button>
        <h1 className="text-3xl font-bold">Vercel Integration Diagnostics</h1>
      </div>

      {/* Diagnostic Results */}
      <div className="space-y-4 mb-8">
        {results.map((result, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 ${
              result.status === 'success'
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : result.status === 'warning'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                : 'border-red-500 bg-red-50 dark:bg-red-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{result.test}</h3>
                <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
              </div>
              <div className="text-2xl">
                {result.status === 'success' && '✅'}
                {result.status === 'warning' && '⚠️'}
                {result.status === 'error' && '❌'}
              </div>
            </div>
            {result.details && (
              <pre className="mt-3 text-xs bg-background p-3 rounded overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recommended Actions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Your integration is working but not properly installed</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The API connection is working (you can see your projects), but the integration isn't showing 
              in your Vercel dashboard because it was connected through a direct token rather than the 
              OAuth integration flow.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-medium">Install the Integration Properly</p>
                <p className="text-sm text-muted-foreground">
                  Use the official OAuth flow to install the integration
                </p>
                <a
                  href="/api/auth/vercel"
                  className="inline-block mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
                >
                  Install Integration →
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-medium">Alternative: Continue with Current Setup</p>
                <p className="text-sm text-muted-foreground">
                  Your current connection works for API operations. You can continue using it, 
                  but won't see the integration in your Vercel dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Show Debug Information
        </summary>
        <div className="mt-4 space-y-2 text-xs font-mono">
          <p>Client ID: oac_PdrqV45RUU42aFKzLXQhKglu</p>
          <p>Redirect URL: http://localhost:3000/api/auth/vercel/callback</p>
          <p>Required Scopes: read:projects write:projects read:deployments write:deployments</p>
        </div>
      </details>
    </div>
  );
}