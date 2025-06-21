// Freighter detection test script
console.log('🔍 Freighter Detection Test Starting...');

// Test 1: Basic window object check
console.log('Test 1 - window.freighter exists:', !!window.freighter);

// Test 2: Check if freighter is in window
console.log('Test 2 - "freighter" in window:', 'freighter' in window);

// Test 3: Check window object keys
const freighterKeys = Object.keys(window).filter(key => key.toLowerCase().includes('freighter'));
console.log('Test 3 - Freighter-related keys in window:', freighterKeys);

// Test 4: Check for common Stellar wallet extensions
const stellarWallets = Object.keys(window).filter(key => 
  key.toLowerCase().includes('stellar') || 
  key.toLowerCase().includes('freighter') ||
  key.toLowerCase().includes('albedo')
);
console.log('Test 4 - Stellar wallet keys:', stellarWallets);

// Test 5: Try API import
import('@stellar/freighter-api').then(api => {
  console.log('Test 5 - Freighter API imported:', !!api);
  
  // Test API methods
  api.isConnected().then(result => {
    console.log('Test 6 - isConnected() result:', result);
  }).catch(error => {
    console.log('Test 6 - isConnected() error:', error.message);
  });
}).catch(error => {
  console.log('Test 5 - Freighter API import failed:', error.message);
});

// Test 6: Document ready state
console.log('Test 7 - Document ready state:', document.readyState);

// Test 7: Page fully loaded check
if (document.readyState === 'complete') {
  console.log('✅ Page fully loaded');
} else {
  window.addEventListener('load', () => {
    console.log('✅ Page load event triggered');
    console.log('Recheck - window.freighter after load:', !!window.freighter);
  });
}

// Test 8: Extension detection via other methods
setTimeout(() => {
  console.log('Test 8 - Delayed check (2s):', !!window.freighter);
}, 2000);

setTimeout(() => {
  console.log('Test 9 - Delayed check (5s):', !!window.freighter);
}, 5000);
