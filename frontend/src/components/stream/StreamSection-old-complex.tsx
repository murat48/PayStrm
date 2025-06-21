'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Play, StopCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { salaryStreamingMethods, signAndSubmitTransaction } from '../../lib/stellar-new';

interface StreamSectionProps {
  publicKey: string;
}

interface Stream {
  id: number;
  employer: string;
  employee: string;
  totalAmount: number;
  ratePerSecond: number;
  startTime: number;
  duration: number;
  withdrawnAmount: number;
  isActive: boolean;
  isPaused: boolean;
}

export default function StreamSection({ publicKey }: StreamSectionProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [freighterStatus, setFreighterStatus] = useState<string>('checking...');
  const [devMode, setDevMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [withdrawAmounts, setWithdrawAmounts] = useState<{ [key: number]: string }>({});
  const [newStream, setNewStream] = useState({
    employee: '',
    amount: '',
    duration: ''
  });

  const loadStreams = useCallback(async () => {
    try {
      // Mock data for now - replace with actual contract calls
      setStreams([
        {
          id: 1,
          employer: publicKey,
          employee: 'GB2FXDYXQJD5DZX7X7X7X7X7X7X7X7X7X7X7X7X7X7X7X7X7',
          totalAmount: 1000,
          ratePerSecond: 0.001,
          startTime: Date.now() - 86400000, // 1 day ago
          duration: 2592000, // 30 days
          withdrawnAmount: 100,
          isActive: true,
          isPaused: false
        }
      ]);
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  }, [publicKey]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // Simple Freighter detection
  useEffect(() => {
    const checkFreighter = () => {
      if (typeof window === 'undefined') {
        setFreighterStatus('⚠️ Server side');
        return;
      }

      if (window.freighter) {
        setFreighterStatus('✅ Freighter detected');
        setDevMode(false);
      } else {
        setFreighterStatus('❌ Freighter not found');
        setDevMode(true);
      }
    };

    // Check immediately and after a delay
    checkFreighter();
    const timer = setTimeout(checkFreighter, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Manual refresh function
  const refreshFreighterStatus = () => {
    if (typeof window !== 'undefined' && window.freighter) {
      setFreighterStatus('✅ Freighter detected');
      setDevMode(false);
    } else {
      setFreighterStatus('❌ Freighter not found');
      setDevMode(true);
    }
  };

  const createStream = async () => {
    if (!newStream.employee || !newStream.amount || !newStream.duration) {
      alert('Please fill all fields');
      return;
    }

    setIsCreating(true);
    try {
      const amountInStroops = parseFloat(newStream.amount) * 10000000;
      const durationInSeconds = parseInt(newStream.duration) * 24 * 60 * 60; // days to seconds

      console.log('🔧 Creating stream with parameters:');
      console.log(`  Employer: ${publicKey}`);
      console.log(`  Employee: ${newStream.employee}`);
      console.log(`  Total Amount: ${amountInStroops} stroops`);
      console.log(`  Duration: ${durationInSeconds} seconds`);

      const xdr = await salaryStreamingMethods.createStream(
        publicKey,
        newStream.employee,
        amountInStroops,
        durationInSeconds
      );

      if (xdr) {
        let result;
        
        if (!devMode && window.freighter) {
          try {
            console.log('🚀 Using Freighter wallet...');
            result = await signAndSubmitTransaction(xdr);
            alert(`✅ Stream created successfully!\n\nHash: ${result.hash}\nExplorer: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
          } catch (freighterError) {
            console.error('Freighter failed:', freighterError);
            result = { hash: `${Date.now()}_mock_transaction`, status: 'PENDING' };
            alert(`⚠️ Freighter failed, used dev mode\n\nMock Hash: ${result.hash}`);
          }
        } else {
          console.log('⚠️ Using development mode');
          result = { hash: `${Date.now()}_mock_transaction`, status: 'PENDING' };
          alert(`✅ Stream simulated!\n\nMock Hash: ${result.hash}\n\n⚠️ Install Freighter for real transactions`);
        }

        // Add to local state
        const newStreamObj: Stream = {
          id: streams.length + 1,
          employer: publicKey,
          employee: newStream.employee,
          totalAmount: parseFloat(newStream.amount),
          ratePerSecond: amountInStroops / durationInSeconds,
          startTime: Date.now(),
          duration: durationInSeconds,
          withdrawnAmount: 0,
          isActive: true,
          isPaused: false
        };

        setStreams([...streams, newStreamObj]);
        setNewStream({ employee: '', amount: '', duration: '' });
      }
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const withdrawPartial = async (streamId: number) => {
    const withdrawAmount = withdrawAmounts[streamId];
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const stream = streams.find(s => s.id === streamId);
    if (!stream) return;

    const available = getAvailableAmount(stream);
    if (parseFloat(withdrawAmount) > available) {
      alert(`Insufficient available balance. Available: ${available.toFixed(7)} XLM`);
      return;
    }

    setIsWithdrawing(streamId);
    try {
      const amountInStroops = parseFloat(withdrawAmount) * 10000000;
      
      const xdr = await salaryStreamingMethods.withdraw(
        streamId, 
        amountInStroops, 
        publicKey
      );
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Update local state
        setStreams(streams.map(stream => 
          stream.id === streamId 
            ? { ...stream, withdrawnAmount: stream.withdrawnAmount + parseFloat(withdrawAmount) }
            : stream
        ));
        
        // Clear the withdraw amount input
        setWithdrawAmounts(prev => ({
          ...prev,
          [streamId]: ''
        }));
        
        alert(`Successfully withdrawn ${withdrawAmount} XLM`);
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to withdraw: ${errorMessage}`);
    } finally {
      setIsWithdrawing(null);
    }
  };

  const withdrawAll = async (streamId: number) => {
    const stream = streams.find(s => s.id === streamId);
    if (!stream) return;

    const available = getAvailableAmount(stream);
    if (available <= 0) {
      alert('No funds available for withdrawal');
      return;
    }

    setIsWithdrawing(streamId);
    try {
      // Convert available amount to stroops for contract call
      const amountInStroops = Math.floor(available * 10000000);
      const xdr = await salaryStreamingMethods.withdraw(streamId, amountInStroops, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Update local state
        setStreams(streams.map(s => 
          s.id === streamId 
            ? { 
                ...s, 
                withdrawnAmount: s.withdrawnAmount + available
              }
            : s
        ));
        
        alert(`Successfully withdrawn ${available.toFixed(7)} XLM`);
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to withdraw: ${errorMessage}`);
    } finally {
      setIsWithdrawing(null);
    }
  };

  const getAvailableAmount = (stream: Stream): number => {
    const now = Date.now();
    const elapsed = Math.max(0, now - stream.startTime) / 1000; // seconds
    const earned = Math.min(elapsed * stream.ratePerSecond, stream.totalAmount);
    return Math.max(0, earned - stream.withdrawnAmount);
  };

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="mr-3 text-green-600" />
            Salary Streaming
          </h2>
          
          {/* Freighter Status and Controls */}
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              <span className="font-medium">Wallet Status:</span> {freighterStatus}
            </div>
            <button
              onClick={refreshFreighterStatus}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100"
              title="Refresh Freighter Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {freighterStatus.includes('❌') && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Dev Mode:</span>
                <button
                  onClick={() => setDevMode(!devMode)}
                  className={`px-2 py-1 text-xs rounded ${
                    devMode 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {devMode ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create New Stream */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Create New Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Employee Address"
              value={newStream.employee}
              onChange={(e) => setNewStream({ ...newStream, employee: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount (XLM)"
              value={newStream.amount}
              onChange={(e) => setNewStream({ ...newStream, amount: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Duration (days)"
              value={newStream.duration}
              onChange={(e) => setNewStream({ ...newStream, duration: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createStream}
              disabled={isCreating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Stream'}
            </button>
          </div>
        </div>

        {/* Active Streams */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Streams</h3>
          {streams.length === 0 ? (
            <p className="text-gray-500">No active streams</p>
          ) : (
            streams.map((stream) => {
              const available = getAvailableAmount(stream);
              const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

              return (
                <div key={stream.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">Stream #{stream.id}</h4>
                      <p className="text-sm text-gray-600">To: {stream.employee}</p>
                      <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Available: {available.toFixed(7)} XLM</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount to withdraw"
                          value={withdrawAmounts[stream.id] || ''}
                          onChange={(e) => setWithdrawAmounts(prev => ({
                            ...prev,
                            [stream.id]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          step="0.0000001"
                          max={available}
                        />
                        <button
                          onClick={() => withdrawPartial(stream.id)}
                          disabled={isWithdrawing === stream.id}
                          className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isWithdrawing === stream.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => withdrawAll(stream.id)}
                        disabled={isWithdrawing === stream.id || available <= 0}
                        className="w-full bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50 mt-2"
                      >
                        Withdraw All Available
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <Clock className="inline w-4 h-4 mr-1" />
                      Duration: {formatTime(stream.duration)}
                    </div>
                    <div>
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                      Withdrawn: {stream.withdrawnAmount.toFixed(7)} XLM
                    </div>
                    <div className="flex items-center">
                      {stream.isActive ? (
                        <><Play className="w-4 h-4 mr-1 text-green-600" /> Active</>
                      ) : (
                        <><StopCircle className="w-4 h-4 mr-1 text-red-600" /> Stopped</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
