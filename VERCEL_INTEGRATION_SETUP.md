# Vercel Integration Setup Guide

## Step-by-Step Instructions

### 1. Create a New Integration

1. Go to: https://vercel.com/dashboard/integrations
2. Click "Create Integration"
3. Fill in:
   - **Integration Name**: vibeweb-app (or any unique name)
   - **Logo**: Upload any 32x32 PNG image
   - **Redirect URL**: `https://8dbd-149-22-81-43.ngrok-free.app/api/auth/vercel/callback`
   - **Description**: Deploy generated web apps to Vercel

### 2. Configure OAuth Scopes

In the Scopes section, ensure these are selected:
- Integration Configuration: Read
- Projects: Read/Write  
- Deployments: Read/Write

### 3. Save and Get Credentials

After creating:
1. Copy the **Client ID** (starts with `oac_`)
2. Copy the **Client Secret**
3. Update your `.env.local`:
```
VERCEL_CLIENT_ID=your_new_client_id
VERCEL_CLIENT_SECRET=your_new_client_secret
```

### 4. Install Your Integration

IMPORTANT: After creating the integration, you must install it:
1. On the integration page, click "View Integration"
2. Click "Add Integration" or "Install"
3. Choose your Vercel account
4. Complete the installation

### 5. Test the Integration

1. Restart your Next.js dev server: `npm run dev`
2. Go to: https://8dbd-149-22-81-43.ngrok-free.app/settings/vercel
3. Click "Install Vercel Integration"

## Troubleshooting

If you still get "Invalid client_id":

1. **Check the OAuth URL directly**:
   Open this in a new tab (replace with your client_id):
   ```
   https://vercel.com/integrations/console/oac_YOUR_CLIENT_ID/integration-detail
   ```

2. **Verify Installation Status**:
   - Go to: https://vercel.com/dashboard/integrations/installed
   - Your integration should be listed there

3. **Try the Integration Marketplace Flow**:
   Instead of OAuth, try:
   ```
   https://vercel.com/integrations/YOUR_INTEGRATION_SLUG
   ```

4. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any CORS errors or additional error messages
   - Check the Network tab for the actual response from Vercel

## Alternative: Personal Access Token

If the OAuth flow continues to fail, you can use a Personal Access Token:

1. Go to: https://vercel.com/account/tokens
2. Create a new token with the required scopes
3. Use this token directly in your app instead of OAuth