'use client';

import { useState } from 'react';
import StreamSection from '@/components/stream/StreamSections';
import LendingSection from '@/components/lending/LendingSection';
import ProfileSection from '@/components/profile/ProfileSection';
import { DollarSign, CreditCard, User } from 'lucide-react';

type TabType = 'stream' | 'lending';

interface DashboardProps {
  publicKey: string;
}

export default function Dashboard({ publicKey }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stream');

  const tabs = [
    { id: 'stream' as TabType, name: 'Salary Streaming', icon: DollarSign },
    { id: 'lending' as TabType, name: 'Lending', icon: CreditCard },
    // { id: 'profile' as TabType, name: 'Profile', icon: User },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PayStream</h1>
        <p className="text-gray-600">
          Manage your salary streams, apply for loans, and update your work profile.
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700">Connected to Stellar Testnet</span>
          </div>
          <div className="text-gray-500">
            Wallet: {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'stream' && <StreamSection publicKey={publicKey} />}
        {activeTab === 'lending' && <LendingSection publicKey={publicKey} />}
        {/* {activeTab === 'profile' && <ProfileSection publicKey={publicKey} />} */}
      </div>
    </div>
  );
}
