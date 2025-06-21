'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Zap, Shield, TrendingUp } from 'lucide-react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';

export default function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      // Try to check if Freighter is available by calling its API
      try {
        const { isConnected: connected } = await isConnected();
        
        if (!connected) {
          // Request access to connect
          await requestAccess();
        }

        // Get public key
        const { address: publicKey } = await getAddress();
        
        // Save to localStorage
        localStorage.setItem('stellar_public_key', publicKey);
        
        // Navigate to dashboard
        router.push('/dashboard');
      } catch (freighterError) {
        // If we get here, Freighter is likely not installed or not working
        console.error('Freighter API error:', freighterError);
        setError('Freighter wallet is not installed or not accessible. Please install it from freighter.app');
        return;
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PayStream</h1>
        <p className="text-gray-600">DeFi Salary Streaming & Risk-Based Lending</p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Real-time Salary Streaming</p>
            <p className="text-sm text-gray-600">Get paid every second you work</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Risk-Based Lending</p>
            <p className="text-sm text-gray-600">Borrow against your salary stream</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Secure & Transparent</p>
            <p className="text-sm text-gray-600">Built on Stellar blockchain</p>
          </div>
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isConnecting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            <span>Connect Freighter Wallet</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Don&apos;t have Freighter? 
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
            Install here
          </a>
        </p>
      </div>
    </div>
  );
}
