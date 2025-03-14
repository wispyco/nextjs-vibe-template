const fs = require('fs');
const path = require('path');

// Simple test to verify the timeout functionality in AuthButton.tsx
async function testAuthButtonTimeout() {
  console.log('Testing AuthButton timeout functionality...');
  
  try {
    // Read the AuthButton component file
    const authButtonPath = path.join(__dirname, '../src/components/auth/AuthButton.tsx');
    const authButtonContent = fs.readFileSync(authButtonPath, 'utf8');
    
    // Check for timeout implementation
    const hasTimeout = authButtonContent.includes('setTimeout') && 
                      authButtonContent.includes('5000');
    
    if (hasTimeout) {
      console.log('✅ AuthButton has timeout implementation');
    } else {
      console.log('❌ AuthButton is missing timeout implementation');
      process.exit(1);
    }
    
    // Check for loadingTimedOut state
    const hasTimedOutState = authButtonContent.includes('loadingTimedOut');
    
    if (hasTimedOutState) {
      console.log('✅ AuthButton has loadingTimedOut state');
    } else {
      console.log('❌ AuthButton is missing loadingTimedOut state');
      process.exit(1);
    }
    
    // Check for retry functionality
    const hasRetryFunction = authButtonContent.includes('handleRetry');
    
    if (hasRetryFunction) {
      console.log('✅ AuthButton has retry functionality');
    } else {
      console.log('❌ AuthButton is missing retry functionality');
      process.exit(1);
    }
    
    // Read the AuthContext file
    const authContextPath = path.join(__dirname, '../src/context/AuthContext.tsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    
    // Check for timeout in AuthContext
    const hasContextTimeout = authContextContent.includes('setTimeout') && 
                             authContextContent.includes('5000');
    
    if (hasContextTimeout) {
      console.log('✅ AuthContext has timeout implementation');
    } else {
      console.log('❌ AuthContext is missing timeout implementation');
      process.exit(1);
    }
    
    console.log('All timeout tests passed! ✅');
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

testAuthButtonTimeout(); 