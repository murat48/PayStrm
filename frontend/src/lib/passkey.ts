import { Keypair } from '@stellar/stellar-sdk';

export interface PasskeyCredential {
  id: string;
  publicKey: Uint8Array;
  stellarAccount: string;
  stellarSecret: string;
}

export class PasskeyWallet {
  private static readonly PASSKEY_STORAGE_KEY = 'passkey_credentials';
  
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'credentials' in navigator;
  }

  static async register(username: string): Promise<PasskeyCredential> {
    if (!PasskeyWallet.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      const credentialId = crypto.getRandomValues(new Uint8Array(32));
      const keypair = Keypair.random();
      
      const credential: PasskeyCredential = {
        id: Buffer.from(credentialId).toString('base64'),
        publicKey: credentialId,
        stellarAccount: keypair.publicKey(),
        stellarSecret: keypair.secret(),
      };

      PasskeyWallet.storeCredential(credential);
      return credential;
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async authenticate(): Promise<PasskeyCredential> {
    const credentials = PasskeyWallet.getAccounts();
    
    if (credentials.length === 0) {
      throw new Error('No passkey credentials found. Please register first.');
    }

    return credentials[0];
  }

  static getAccounts(): PasskeyCredential[] {
    try {
      const stored = localStorage.getItem(PasskeyWallet.PASSKEY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private static storeCredential(credential: PasskeyCredential): void {
    try {
      const existing = PasskeyWallet.getAccounts();
      const updated = [...existing, credential];
      localStorage.setItem(PasskeyWallet.PASSKEY_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      throw new Error('Failed to store credential');
    }
  }

  static clearCredentials(): void {
    try {
      localStorage.removeItem(PasskeyWallet.PASSKEY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }
}
