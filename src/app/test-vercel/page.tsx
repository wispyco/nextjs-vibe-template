'use client';

import { useState } from 'react';

export default function TestVercelPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWithToken = async () => {
    if (!token) {
      setResult({ error: 'Please enter a token' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testOAuthDirectly = () => {
    const clientId = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID || 'oac_PdrqV45RUU42aFKzLXQhKglu';
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/vercel/callback');
    const scope = encodeURIComponent('read:projects write:projects read:deployments write:deployments offline_access');
    
    const url = `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Test Vercel Integration</h1>
      
      <div className="space-y-8">
        {/* Test OAuth Flow */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Test OAuth Flow</h2>
          <p className="text-muted-foreground mb-4">
            Click to test the OAuth URL directly. This will open in a new tab.
          </p>
          <button
            onClick={testOAuthDirectly}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Test OAuth URL
          </button>
          <div className="mt-4 p-4 bg-muted rounded text-xs">
            <p>Client ID: oac_PdrqV45RUU42aFKzLXQhKglu</p>
            <p>Redirect: http://localhost:3000/api/auth/vercel/callback</p>
          </div>
        </div>

        {/* Test with Personal Access Token */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Test with Personal Access Token</h2>
          <p className="text-muted-foreground mb-4">
            As an alternative, test with a Personal Access Token from Vercel.
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground mb-4">
            <li>Go to <a href="https://vercel.com/account/tokens" target="_blank" className="underline">Vercel Tokens</a></li>
            <li>Create a token with project and deployment scopes</li>
            <li>Paste it below</li>
          </ol>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter Vercel Personal Access Token"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            onClick={testWithToken}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Token'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-2">Result:</h3>
            <pre className="bg-muted p-4 rounded overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}