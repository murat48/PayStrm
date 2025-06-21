'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import { isConnected, isAllowed, getAddress } from '@stellar/freighter-api';

export default function DashboardPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkWalletConnection = useCallback(async () => {
    try {
      // Check localStorage first
      const savedKey = localStorage.getItem('stellar_public_key');
      if (savedKey) {
        setPublicKey(savedKey);
        setIsLoading(false);
        return;
      }

      // Try to check Freighter wallet directly
      try {
        const { isConnected: connected } = await isConnected();
        if (connected) {
          const { isAllowed: allowed } = await isAllowed();
          if (allowed) {
            const { address: key } = await getAddress();
            setPublicKey(key);
            localStorage.setItem('stellar_public_key', key);
            setIsLoading(false);
            return;
          }
        }
      } catch (freighterError) {
        // Freighter not available - redirect to main page
        console.log('Freighter not available:', freighterError);
      }

      // No wallet connection found, redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    checkWalletConnection();
  }, [checkWalletConnection]);

  const handleDisconnect = () => {
    localStorage.removeItem('stellar_public_key');
    setPublicKey(null);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No wallet connected</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header publicKey={publicKey} onDisconnect={handleDisconnect} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Dashboard publicKey={publicKey} />
      </main>
    </div>
  );
}
