'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { isConnected as checkIsConnected, isAllowed, getAddress, requestAccess } from '@stellar/freighter-api';

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const router = useRouter();

  const checkConnection = useCallback(async () => {
    try {
      // Try to check Freighter connection directly
      const { isConnected: connected } = await checkIsConnected();
      if (connected) {
        const { isAllowed: allowed } = await isAllowed();
        if (allowed) {
          const { address: publicKey } = await getAddress();
          setPublicKey(publicKey);
          setIsConnected(true);
          // Auto redirect if already connected
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      }
    } catch (error) {
      // Freighter not available or other error - this is fine, just means not connected
      console.log('Freighter not available or not connected:', error);
    }
  }, [router]);

  // Check if user is already connected on page load
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Try to connect using Freighter API directly
      try {
        // Check if Freighter is connected
        const { isConnected: connected } = await checkIsConnected();
        if (!connected) {
          alert('Please make sure Freighter Wallet is installed and connected');
          setIsLoading(false);
          return;
        }

        // Request access
        await requestAccess();
        
        // Get user's public key
        const { address: publicKey } = await getAddress();
        
        // Save to state and localStorage
        setPublicKey(publicKey);
        setIsConnected(true);
        localStorage.setItem('stellar_public_key', publicKey);
        
        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 1000);
      } catch (freighterError) {
        // Freighter not available or user rejected
        console.error('Freighter error:', freighterError);
        alert('Please install Freighter Wallet extension');
        window.open('https://freighter.app/', '_blank');
      }
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full py-6 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">PayStream</h1>
          </div>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  <span>Connect Freighter Wallet</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">
                {publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Connected'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Real-Time Salary Streaming
            <span className="block text-blue-600">& Risk-Based Lending</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stream your salary in real-time and use your income as collateral for instant loans. 
            Built on Stellar Soroban for transparency and efficiency.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Salary Streaming</h3>
            <p className="text-gray-600">
              Receive your salary in real-time as it&apos;s earned. Withdraw anytime, 
              pause or resume streams with full control.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Lending</h3>
            <p className="text-gray-600">
              Use your salary stream as collateral to get instant loans. 
              Smart contracts ensure automatic repayment from your stream.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Risk-Based Rates</h3>
            <p className="text-gray-600">
              Build your work profile to improve your risk score and access better 
              interest rates based on your employment history.
            </p>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="max-w-md mx-auto">
          {!isConnected ? (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-center mb-6">
                <Wallet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">
                  Connect your Freighter wallet to start streaming salary and accessing loans
                </p>
              </div>
              
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>Connect Freighter Wallet</span>
                  </>
                )}
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                Don&apos;t have Freighter? 
                <a 
                  href="https://freighter.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Install here
                </a>
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Wallet Connected!</h3>
              <p className="text-green-700 mb-4">
                {publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Connected'}
              </p>
              <div className="flex items-center justify-center text-green-600">
                <span>Redirecting to dashboard</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Running on Stellar Testnet • Built with Soroban Smart Contracts • Powered by Freighter Wallet
          </p>
        </div>
      </main>
    </div>
  );
}
