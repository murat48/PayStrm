'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Wallet,
  BarChart3,
  Zap,
  Shield,
  Target,
  RefreshCw
} from 'lucide-react';
import { isConnected, getAddress } from '@stellar/freighter-api';
import ModernHeader from '../../components/layout/ModernHeader';
import ModernCard, { StatsCard, ActionCard } from '../../components/layout/ModernCard';
import StreamSection from '../../components/stream/StreamSections';

export default function DashboardPage() {
  const [publicKey, setPublicKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalEarned: '12,450.00',
    activeStreams: 3,
    availableBalance: '2,840.50',
    loansActive: 1
  });
  const router = useRouter();

  const checkConnection = useCallback(async () => {
    try {
      const { isConnected: connected } = await isConnected();
      if (!connected) {
        router.push('/');
        return;
      }
      
      const { address } = await getAddress();
      setPublicKey(address);
    } catch (error) {
      console.error('Failed to check connection:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleDisconnect = () => {
    router.push('/');
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        totalEarned: (parseFloat(prev.totalEarned.replace(',', '')) + Math.random() * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }));
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ModernHeader publicKey={publicKey} onDisconnect={handleDisconnect} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's what's happening with your streams and finances today.
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'streams', name: 'Streams', icon: Zap },
                { id: 'lending', name: 'Lending', icon: Shield },
                { id: 'profile', name: 'Profile', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Earned"
                value={`$${stats.totalEarned}`}
                change="+12.5% from last month"
                trend="up"
                icon={DollarSign}
                description="Lifetime earnings from all streams"
              />
              
              <StatsCard
                title="Active Streams"
                value={stats.activeStreams}
                change="2 paused streams"
                trend="neutral"
                icon={Zap}
                description="Currently running payment streams"
              />
              
              <StatsCard
                title="Available Balance"
                value={`$${stats.availableBalance}`}
                change="Ready for withdrawal"
                trend="up"
                icon={Wallet}
                description="Earned but not yet withdrawn"
              />
              
              <StatsCard
                title="Active Loans"
                value={stats.loansActive}
                change="$5,000 outstanding"
                trend="neutral"
                icon={Target}
                description="Current loan obligations"
              />
            </div>

            {/* Quick Actions */}
            <ModernCard title="Quick Actions" description="Common tasks and operations">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard
                  title="Create Stream"
                  description="Set up a new salary stream for an employee"
                  icon={Plus}
                  actionText="Create Now"
                  onAction={() => setActiveTab('streams')}
                  variant="primary"
                />
                
                <ActionCard
                  title="Request Loan"
                  description="Apply for a loan using your stream as collateral"
                  icon={TrendingUp}
                  actionText="Apply Now"
                  onAction={() => setActiveTab('lending')}
                  variant="success"
                />
                
                <ActionCard
                  title="Update Profile"
                  description="Improve your risk score and loan terms"
                  icon={Users}
                  actionText="Update"
                  onAction={() => setActiveTab('profile')}
                  variant="secondary"
                />
              </div>
            </ModernCard>

            {/* Recent Activity */}
            <ModernCard title="Recent Activity" description="Your latest transactions and updates">
              <div className="space-y-4">
                {[
                  {
                    type: 'withdrawal',
                    amount: '$500.00',
                    description: 'Withdrawn from Stream #12',
                    time: '2 hours ago',
                    icon: ArrowUpRight,
                    color: 'text-green-600'
                  },
                  {
                    type: 'stream',
                    amount: '$2,100.00',
                    description: 'New stream created for John Doe',
                    time: '1 day ago',
                    icon: Zap,
                    color: 'text-blue-600'
                  },
                  {
                    type: 'loan',
                    amount: '$5,000.00',
                    description: 'Loan approved and disbursed',
                    time: '3 days ago',
                    icon: ArrowDownRight,
                    color: 'text-purple-600'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center ${activity.color}`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${activity.color}`}>{activity.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ModernCard>
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="animate-fade-in-up">
            <StreamSection publicKey={publicKey} />
          </div>
        )}

        {activeTab === 'lending' && (
          <div className="animate-fade-in-up">
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Lending Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400">Lending functionality coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in-up">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Profile management coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
