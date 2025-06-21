// Enhanced Freighter Detection Utility
// Add this to your stellar-new.ts or create a separate freighter-utils.ts file

// Multiple detection strategies for Freighter
export const detectFreighter = async (): Promise<{
  detected: boolean;
  method: string;
  freighter?: any;
  error?: string;
}> => {
  if (typeof window === 'undefined') {
    return { detected: false, method: 'server-side', error: 'Server-side environment' };
  }

  console.log('🔍 Starting comprehensive Freighter detection...');

  // Strategy 1: Direct window.freighter check
  if (window.freighter && typeof window.freighter === 'object') {
    console.log('✅ Method 1: Direct window.freighter detected');
    return { detected: true, method: 'direct', freighter: window.freighter };
  }

  // Strategy 2: Check for freighter in window object
  if ('freighter' in window) {
    console.log('✅ Method 2: freighter property in window detected');
    return { detected: true, method: 'property', freighter: window.freighter };
  }

  // Strategy 3: Check for any freighter-related properties
  const freighterKeys = Object.keys(window).filter(key => 
    key.toLowerCase().includes('freighter') || 
    key.toLowerCase().includes('stellar')
  );
  
  if (freighterKeys.length > 0) {
    console.log('✅ Method 3: Freighter-related keys found:', freighterKeys);
    const freighterObj = (window as any)[freighterKeys[0]];
    return { detected: true, method: 'key-search', freighter: freighterObj };
  }

  // Strategy 4: Check for Freighter API through document
  const freighterMeta = document.querySelector('meta[name="freighter"]');
  if (freighterMeta) {
    console.log('✅ Method 4: Freighter meta tag detected');
    // Try to access freighter after a short delay
    await new Promise(resolve => setTimeout(resolve, 100));
    if (window.freighter) {
      return { detected: true, method: 'meta-tag', freighter: window.freighter };
    }
  }

  // Strategy 5: Check for Freighter script injection
  const freighterScript = document.querySelector('script[src*="freighter"]');
  if (freighterScript) {
    console.log('✅ Method 5: Freighter script detected');
    // Wait a bit for script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    if (window.freighter) {
      return { detected: true, method: 'script-tag', freighter: window.freighter };
    }
  }

  // Strategy 6: Listen for Freighter injection events
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('❌ All detection methods failed');
      resolve({ 
        detected: false, 
        method: 'timeout', 
        error: 'Freighter not detected after comprehensive check' 
      });
    }, 2000);

    // Listen for potential Freighter injection
    const checkFreighterPeriodically = () => {
      if (window.freighter) {
        clearTimeout(timeout);
        console.log('✅ Method 6: Freighter detected via periodic check');
        resolve({ detected: true, method: 'periodic', freighter: window.freighter });
        return;
      }
    };

    // Check every 100ms for 2 seconds
    const interval = setInterval(checkFreighterPeriodically, 100);
    
    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
  });
};

// Enhanced wallet connection checker using the new detection
export const checkWalletConnectionEnhanced = async (): Promise<{
  connected: boolean;
  address?: string;
  error?: string;
  debug?: any;
}> => {
  try {
    console.log('🔍 Enhanced wallet connection check starting...');
    
    // First, detect Freighter with all methods
    const detection = await detectFreighter();
    
    if (!detection.detected) {
      console.log('❌ Freighter not detected:', detection.error);
      return {
        connected: false,
        error: 'Freighter wallet extension not found. Please install from https://www.freighter.app/',
        debug: { detection }
      };
    }

    console.log(`✅ Freighter detected via ${detection.method}`);
    const freighter = detection.freighter;

    // Check if freighter object has required methods
    if (!freighter || typeof freighter !== 'object') {
      return {
        connected: false,
        error: 'Freighter object is invalid',
        debug: { detection, freighterType: typeof freighter }
      };
    }

    // Check for required methods
    const requiredMethods = ['isAllowed', 'isConnected', 'getAddress', 'requestAccess'];
    const missingMethods = requiredMethods.filter(method => typeof freighter[method] !== 'function');
    
    if (missingMethods.length > 0) {
      console.warn('⚠️ Freighter missing methods:', missingMethods);
      // Continue anyway as some versions might have different method names
    }

    // Check if we have access
    try {
      let isAllowed = false;
      if (typeof freighter.isAllowed === 'function') {
        isAllowed = await freighter.isAllowed();
        console.log('🔑 Freighter access check:', isAllowed);
        
        if (!isAllowed) {
          console.log('🔑 Requesting Freighter access...');
          if (typeof freighter.requestAccess === 'function') {
            await freighter.requestAccess();
            isAllowed = await freighter.isAllowed();
          }
        }
      } else {
        console.warn('⚠️ isAllowed method not available, assuming access granted');
        isAllowed = true;
      }

      if (!isAllowed) {
        return {
          connected: false,
          error: 'Freighter access denied. Please allow access in the Freighter extension.',
          debug: { detection, isAllowed }
        };
      }
    } catch (accessError) {
      console.error('❌ Freighter access check failed:', accessError);
      return {
        connected: false,
        error: `Freighter access check failed: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`,
        debug: { detection, accessError }
      };
    }
    
    // Check if connected
    try {
      let isConnected = false;
      if (typeof freighter.isConnected === 'function') {
        isConnected = await freighter.isConnected();
        console.log('🔗 Freighter connection check:', isConnected);
        
        if (!isConnected) {
          return {
            connected: false,
            error: 'Freighter wallet is not connected. Please connect your wallet in the Freighter extension.',
            debug: { detection, isConnected }
          };
        }
      } else {
        console.warn('⚠️ isConnected method not available, assuming connected');
        isConnected = true;
      }
    } catch (connectionError) {
      console.error('❌ Freighter connection check failed:', connectionError);
      return {
        connected: false,
        error: `Freighter connection check failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`,
        debug: { detection, connectionError }
      };
    }

    // Get wallet address
    try {
      if (typeof freighter.getAddress !== 'function') {
        return {
          connected: false,
          error: 'Freighter getAddress method not available',
          debug: { detection, methods: Object.keys(freighter) }
        };
      }

      const addressResult = await freighter.getAddress();
      let address: string;
      
      if (typeof addressResult === 'string') {
        address = addressResult;
      } else if (addressResult && typeof addressResult === 'object' && addressResult.address) {
        address = addressResult.address;
      } else {
        throw new Error('Invalid address result format');
      }

      console.log('✅ Wallet address retrieved:', address);
      
      return {
        connected: true,
        address,
        debug: { detection, addressResult }
      };
    } catch (addressError) {
      console.error('❌ Failed to get wallet address:', addressError);
      return {
        connected: false,
        error: `Failed to get wallet address: ${addressError instanceof Error ? addressError.message : 'Unknown error'}`,
        debug: { detection, addressError }
      };
    }
  } catch (error) {
    console.error('❌ Enhanced wallet connection check failed:', error);
    return {
      connected: false,
      error: `Wallet check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      debug: { error }
    };
  }
};

// Utility to wait for page load and extension initialization
export const waitForPageAndFreighter = async (maxWait = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkReady = async () => {
      // Check if page is loaded
      if (document.readyState !== 'complete') {
        if (Date.now() - startTime < maxWait) {
          setTimeout(checkReady, 100);
          return;
        }
        resolve(false);
        return;
      }

      // Check for Freighter
      const detection = await detectFreighter();
      if (detection.detected) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime < maxWait) {
        setTimeout(checkReady, 100);
      } else {
        resolve(false);
      }
    };

    // Start checking immediately, but also after page load
    checkReady();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', checkReady);
    }
  });
};