'use client';

import { useState, useEffect } from 'react';
import StreamSection from '@/components/stream/StreamSections';
import LendingSection from '@/components/lending/LendingSection';

import { 
  DollarSign, 
  CreditCard, 
  User, 
  Zap, 
  Shield, 
  TrendingUp, 
  Clock, 
  Wallet,
  BarChart3,
  ArrowUpRight,
  Activity,
  Star
} from 'lucide-react';

type TabType = 'stream' | 'lending';

interface DashboardProps {
  publicKey: string;
}

export default function Dashboard({ publicKey }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [mounted, setMounted] = useState(false);
const [userStreams, setUserStreams] = useState([]);
  useEffect(() => {
    setMounted(true);
  }, []);



  const tabs = [
    { 
      id: 'stream' as TabType, 
      name: 'Salary Streaming', 
      icon: Zap,
      description: 'Manage real-time payments',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
      textColor: 'text-blue-600'
    },
    { 
      id: 'lending' as TabType, 
      name: 'Lending', 
      icon: Shield,
      description: 'Stream-backed loans',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-600'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section with Enhanced Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 rounded-3xl p-8 border border-white/30 backdrop-blur-lg shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  PayStream Pro
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Your advanced financial streaming platform
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-white/40">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-green-700 font-semibold text-sm">Stellar Testnet Active</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white/40">
                <span className="text-gray-600 text-sm font-mono tracking-wider">
                  {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Background Decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-300 to-indigo-300 rounded-full blur-2xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full blur-xl opacity-20 animate-bounce"></div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tabs.map((tab, index) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative p-8 rounded-3xl border transition-all duration-500 text-left transform ${
                isActive
                  ? 'bg-white shadow-2xl border-white/40 scale-[1.02] ring-2 ring-indigo-500/20'
                  : 'bg-white/70 backdrop-blur-sm border-white/40 hover:bg-white/90 hover:shadow-xl hover:scale-[1.01]'
              } ${mounted ? 'animate-in fade-in slide-in-from-bottom-6' : ''}`}
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div className="flex items-start space-x-6">
                <div className={`relative w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-500 ${
                  isActive 
                    ? `bg-gradient-to-br ${tab.color} shadow-2xl` 
                    : `bg-gradient-to-br ${tab.bgColor} group-hover:${tab.color}`
                }`}>
                  <IconComponent className={`h-8 w-8 transition-all duration-500 ${
                    isActive ? 'text-white scale-110' : `${tab.textColor} group-hover:text-white group-hover:scale-110`
                  }`} />
                  
                  {/* Pulse animation for active state */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${tab.color} opacity-75 animate-ping`}></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                    isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {tab.name}
                  </h3>
                  <p className={`text-base transition-colors duration-300 ${
                    isActive ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {tab.description}
                  </p>
                  
                  {/* Feature indicators */}
                  <div className="flex items-center space-x-3 mt-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                      isActive 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-gray-50 text-gray-600 group-hover:bg-gray-100'
                    }`}>
                      <BarChart3 className="h-3 w-3" />
                      <span>Analytics</span>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                      isActive 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-gray-50 text-gray-600 group-hover:bg-gray-100'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Active state indicator */}
              {isActive && (
                <div className="absolute top-6 right-6">
                  <div className="relative">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              )}
              
              {/* Enhanced active indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0">
                  <div className={`h-2 bg-gradient-to-r ${tab.color} rounded-b-3xl shadow-lg`}></div>
                  <div className={`h-1 bg-gradient-to-r ${tab.color} opacity-50 blur-sm`}></div>
                </div>
              )}
              
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            </button>
          );
        })}
      </div>

      {/* Enhanced Tab Content with Better Transitions */}
      <div className="relative min-h-[700px]">
        <div className="absolute inset-0">
          {activeTab === 'stream' && (
            <div 
              className={`h-full transition-all duration-700 ease-out ${
                mounted ? 'animate-in fade-in slide-in-from-right-8' : ''
              }`}
              key="stream-content"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-2xl p-8">
                <StreamSection publicKey={publicKey} />
              </div>
            </div>
          )}
          {activeTab === 'lending' && (
            <div 
              className={`h-full transition-all duration-700 ease-out ${
                mounted ? 'animate-in fade-in slide-in-from-left-8' : ''
              }`}
              key="lending-content"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-2xl p-8">
                <LendingSection publicKey={publicKey} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
