// global.d.ts - Type declarations for Freighter
declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getAddress: () => Promise<{ address: string }>;
      requestAccess: () => Promise<void>;
      isAllowed: () => Promise<boolean>;
      setAllowed: () => Promise<void>;
      signTransaction: (txn: string, opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }) => Promise<{ signedTxXdr: string }>;
    };
    // Support for older browsers or different implementations
    [key: string]: unknown;
  }
  
  // Freighter global check helper
  function isFreighterAvailable(): boolean;
}

export {};
