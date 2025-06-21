'use client';

import { Zap, Wallet } from 'lucide-react';

interface HeaderProps {
  publicKey: string;
  onDisconnect: () => void;
}

export default function Header({ publicKey, onDisconnect }: HeaderProps) {
  const shortAddress = `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PayStream</h1>
              <p className="text-xs text-gray-500">DeFi Salary Streaming</p>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Testnet</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Wallet className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{shortAddress}</span>
              <button
                onClick={onDisconnect}
                className="ml-2 text-xs text-red-600 hover:text-red-800 transition-colors"
                title="Disconnect"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
