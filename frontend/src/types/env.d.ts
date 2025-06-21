// Environment variables type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: string;
      NEXT_PUBLIC_STELLAR_RPC_URL: string;
      NEXT_PUBLIC_LENDING_CONTRACT_ID: string;
      NEXT_PUBLIC_SALARY_STREAMING_CONTRACT_ID: string;
      NEXT_PUBLIC_WORK_PROFILE_CONTRACT_ID: string;
      NEXT_PUBLIC_ENVIRONMENT: 'testnet' | 'mainnet' | 'development';
    }
  }
}

export {};
