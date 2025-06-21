'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Play, StopCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { salaryStreamingMethods, signAndSubmitTransaction } from '../../lib/stellar-working';
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  getNetworkDetails
} from '@stellar/freighter-api';

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
  const [freighterConnected, setFreighterConnected] = useState(false);
  const [freighterAllowed, setFreighterAllowed] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [withdrawAmounts, setWithdrawAmounts] = useState<{ [key: number]: string }>({});
  const [newStream, setNewStream] = useState({
    employee: 'GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A',
    amount: '100000000000',
    duration: '30'
  });

  // Real mode only - blockchain data
  // Real mode only - no test mode

  const loadStreams = useCallback(async () => {
    // Only load streams if user address is available
    if (!userAddress) {
      console.log('🔍 User address not available yet, skipping stream load');
      return;
    }
    
    try {
      // Blockchain'den TÜM stream'ları çek
      console.log('🌐 Blockchain\'den TÜM streamlar yükleniyor...');
      console.log('👤 Current user address:', userAddress);
      
      console.log('📥 Contract\'tan TÜM streams çekiliyor...');
      
      let allStreams: Stream[] = [];
      
      // Tüm stream'ları çek (herkes görebilsin)
      try {
        console.log('🌍 TÜM streams call başlıyor...');
        const allStreamData = await salaryStreamingMethods.getAllStreams();
        console.log('✅ TÜM streams başarılı:', allStreamData);
        
        // Tüm stream'ları parse et
        if (allStreamData && Array.isArray(allStreamData)) {
          const parsedStreams = allStreamData.map((stream: any) => ({
            id: stream.id,
            employer: stream.employer,
            employee: stream.employee,
            totalAmount: parseInt(stream.total_amount) / 10000000, // stroops to XLM
            ratePerSecond: parseInt(stream.rate_per_second) / 10000000, // stroops/sec to XLM/sec
            startTime: parseInt(stream.start_time),
            duration: parseInt(stream.duration_seconds),
            withdrawnAmount: parseInt(stream.withdrawn_amount) / 10000000, // stroops to XLM
            isActive: stream.is_active,
            isPaused: stream.is_paused
          }));
          
          // Filter streams: only show streams where current user is employee or employer
          const userStreams = parsedStreams.filter(stream => 
            stream.employee === userAddress || stream.employer === userAddress
          );
          
          allStreams = userStreams;
          console.log(`✅ ${parsedStreams.length} toplam stream parsed`);
          console.log(`🔍 ${userStreams.length} user streams (filtered for: ${userAddress})`);
          
          // Debug: Her user için kaç stream olduğunu göster
          const userCounts: { [key: string]: number } = {};
          parsedStreams.forEach(stream => {
            userCounts[stream.employer] = (userCounts[stream.employer] || 0) + 1;
          });
          console.log('📊 Stream dağılımı (employer bazında):', userCounts);
          console.log('📊 GALDPLQ... adresinin stream sayısı:', userCounts['GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA'] || 0);
        }
      } catch (error) {
        console.error('❌ Tüm streams hata:', error);
        // Hata durumunda boş array
        allStreams = [];
      }
      
      console.log('✅ Toplam streams:', allStreams);
      setStreams(allStreams);
      
    } catch (error) {
      console.error('❌ Failed to load streams:', error);
      // Hata durumunda boş array set et
      setStreams([]);
    }
  }, [userAddress]); // Filter streams based on user address

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // FreighterWalletDocs.md'e göre Freighter detection
  useEffect(() => {
    // Clear any existing state on component mount
    setStreams([]);
    setWithdrawAmounts({});
    
    const checkFreighterStep = async () => {
      try {
        console.log('🔍 Step 1: Checking if Freighter is connected...');
        
        // Step 1: Check if Freighter is connected (isConnected)
        const connectionResult = await isConnected();
        console.log('Connection result:', connectionResult);
        
        if (connectionResult.isConnected) {
          setFreighterConnected(true);
          setFreighterStatus('✅ Freighter connected');
          
          console.log('🔍 Step 2: Checking if app is allowed...');
          
          // Step 2: Check if the user authorized your app (isAllowed)
          const allowedResult = await isAllowed();
          console.log('Allowed result:', allowedResult);
          
          if (allowedResult.isAllowed) {
            setFreighterAllowed(true);
            setFreighterStatus('✅ Freighter authorized');
            
            console.log('🔍 Step 3: Getting public key...');
            
            // Step 3: Get public key (getAddress)
            const addressResult = await getAddress();
            console.log('Address result:', addressResult);
            
            if (addressResult.address) {
              setUserAddress(addressResult.address);
              setFreighterStatus(`✅ Connected: ${addressResult.address.substring(0, 8)}...`);
              
              console.log('🔍 Step 4: Getting network info...');
              
              // Step 4: Show network (getNetworkDetails)
              const networkDetails = await getNetworkDetails();
              console.log('Network details:', networkDetails);
              setNetworkInfo(networkDetails);
            } else {
              setFreighterStatus('⚠️ Could not get address');
            }
          } else {
            setFreighterStatus('⚠️ App not authorized');
          }
        } else {
          setFreighterConnected(false);
          setFreighterStatus('❌ Freighter not connected');
        }
      } catch (error) {
        console.error('Freighter detection error:', error);
        setFreighterStatus('❌ Freighter error');
      }
    };

    // Check immediately and after a delay
    checkFreighterStep();
    const timer = setTimeout(checkFreighterStep, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Request access function (docs step 2)
  const requestFreighterAccess = async () => {
    try {
      console.log('🔑 Requesting Freighter access...');
      const result = await requestAccess();
      console.log('Access result:', result);
      
      if (result.address) {
        setUserAddress(result.address);
        setFreighterAllowed(true);
        setFreighterStatus(`✅ Connected: ${result.address.substring(0, 8)}...`);
        
        // Also get network info
        const networkDetails = await getNetworkDetails();
        setNetworkInfo(networkDetails);
      } else if (result.error) {
        console.error('Access error:', result.error);
        alert(`Failed to get access: ${result.error}`);
      }
    } catch (error) {
      console.error('Request access failed:', error);
      alert('Failed to request Freighter access');
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

      const xdr = await salaryStreamingMethods.createStream(
        publicKey,           // employer (string)
        newStream.employee,  // employee (string)  
        amountInStroops,     // total_amount (number)
        durationInSeconds    // duration_seconds (number)
      );

      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
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
        
        // Success message
        alert(`✅ Stream başarıyla oluşturuldu!\n\n💰 Miktar: ${newStream.amount} XLM\n👤 Çalışan: ${newStream.employee}\n⏰ Süre: ${newStream.duration} gün\n🆔 Stream ID: ${newStreamObj.id}`);
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

    // Debug: Current user and stream info
    console.log('🔍 Withdraw Debug Info:');
    console.log('  Current publicKey:', publicKey);
    console.log('  Stream employee:', stream.employee);
    console.log('  Stream employer:', stream.employer);
    console.log('  User is employee:', stream.employee === publicKey);
    console.log('  Freighter address:', userAddress);
    console.log('  Withdraw amount:', withdrawAmount);

    // Check if current user is the employee of this stream
    if (stream.employee !== publicKey) {
      alert(`Only the employee can withdraw from this stream. You: ${publicKey}, Employee: ${stream.employee}`);
      return;
    }

    const available = getAvailableAmount(stream);
    if (parseFloat(withdrawAmount) > available) {
      alert(`Insufficient available balance. Available: ${available.toFixed(2)} XLM`);
      return;
    }

    setIsWithdrawing(streamId);
    
    try {
      // Blockchain transaction
      console.log('🌐 Blockchain withdraw...');
      const amountInStroops = Math.floor(parseFloat(withdrawAmount) * 10000000);
      
      console.log('📋 Transaction Parameters (detailed):');
      console.log('  Stream ID:', streamId);
      console.log('  Amount (stroops):', amountInStroops);
      console.log('  Amount (XLM):', withdrawAmount);
      console.log('  Authorization address:', publicKey);
      console.log('  CLI equivalent: stellar contract invoke --stream_id', streamId, '--amount', amountInStroops);
      console.log('  Available amount:', available.toFixed(2), 'XLM');
      console.log('  Stream employee:', stream.employee);
      console.log('  Stream employer:', stream.employer);
      
      // Use the employee's (current user's) publicKey for authorization
      const xdr = await salaryStreamingMethods.withdraw(
        streamId, 
        amountInStroops, 
        publicKey  // This should be the employee's address
      );
      
      if (xdr) {
        console.log('✅ XDR generated, signing...');
        await signAndSubmitTransaction(xdr);
        
        // Update local state
        setStreams(streams.map(stream => 
          stream.id === streamId 
            ? { ...stream, withdrawnAmount: stream.withdrawnAmount + parseFloat(withdrawAmount) }
            : stream
        ));
        
        // Kalan miktarı hesapla ve göster
        const updatedStream = streams.find(s => s.id === streamId);
        if (updatedStream) {
          const newWithdrawnAmount = updatedStream.withdrawnAmount + parseFloat(withdrawAmount);
          const newAvailableAmount = getAvailableAmount({
            ...updatedStream,
            withdrawnAmount: newWithdrawnAmount
          });
          
          alert(`✅ Withdraw başarılı!\n\n💰 Çekilen: ${withdrawAmount} XLM\n📊 Kalan Available: ${newAvailableAmount.toFixed(2)} XLM\n📈 Toplam Çekilen: ${newWithdrawnAmount.toFixed(2)} XLM`);
        } else {
          alert(`Successfully withdrawn ${withdrawAmount} XLM`);
        }
      }
      
      // Clear the withdraw amount input
      setWithdrawAmounts(prev => ({
        ...prev,
        [streamId]: ''
      }));
      
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
      alert('No available amount to withdraw');
      return;
    }

    setIsWithdrawing(streamId);
    try {
      // Blockchain transaction - CLI benzeri
      console.log('🌐 Blockchain withdraw all...');
      
      // CLI'da çalışan mantığı kullan - tam miktar, 0.99 multiplier yok
      const amountInStroops = Math.floor(available * 10000000*0.99);
      
      console.log('📋 Withdraw All Parameters (CLI-like):');
      console.log('  Stream ID:', streamId);
      console.log('  Available (XLM):', available);
      console.log('  Amount (stroops):', amountInStroops);
      console.log('  Authorization address:', publicKey);
console.log('  CLI equivalent: stellar contract invoke --stream_id', streamId, '--amount', amountInStroops);
debugger;
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
        
        // Withdraw All sonrası kalan miktar
        const updatedStream = streams.find(s => s.id === streamId);
        if (updatedStream) {
          const newWithdrawnAmount = updatedStream.withdrawnAmount + available;
          const newAvailableAmount = getAvailableAmount({
            ...updatedStream,
            withdrawnAmount: newWithdrawnAmount
          });
          
          alert(`✅ Withdraw All başarılı!\n\n💰 Çekilen: ${available.toFixed(2)} XLM\n📊 Kalan Available: ${newAvailableAmount.toFixed(2)} XLM\n📈 Toplam Çekilen: ${newWithdrawnAmount.toFixed(2)} XLM`);
        } else {
          alert(`Successfully withdrawn ${available.toFixed(2)} XLM`);
        }
      }
    } catch (error) {
      console.log(error);
      console.error('Failed to withdraw:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to withdraw: ${errorMessage}`);
    } finally {
      setIsWithdrawing(null);
    }
  };

  const pauseStream = async (streamId: number) => {
    try {
      console.log('⏸️ Pausing stream:', streamId);
      const xdr = await salaryStreamingMethods.pauseStream(streamId, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`Stream ${streamId} paused successfully`);
        
        // Refresh streams
        await loadStreams();
      }
    } catch (error) {
      console.error('Failed to pause stream:', error);
      alert('Failed to pause stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const resumeStream = async (streamId: number) => {
    
    try {
      console.log('▶️ Resuming stream:', streamId);
      const xdr = await salaryStreamingMethods.resumeStream(streamId, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`Stream ${streamId} resumed successfully`);
        
        // Refresh streams
        await loadStreams();
      }
    } catch (error) {
      console.error('Failed to resume stream:', error);
      alert('Failed to resume stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const endStream = async (streamId: number) => {
    if (!confirm(`Are you sure you want to end stream ${streamId}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      debugger;
      console.log('🔒 Ending stream:', streamId);
      const xdr = await salaryStreamingMethods.endStream(streamId, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`Stream ${streamId} ended successfully`);
        
        // Refresh streams
        await loadStreams();
      }
    } catch (error) {
      console.error('Failed to end stream:', error);
      alert('Failed to end stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };



  const getAvailableAmount = (stream: Stream): number => {
    if (!stream.isActive || stream.isPaused) {
      return 0; // Paused or inactive streams have no available amount
    }
    
    const now = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, now - stream.startTime);
    
    // Artık her şey XLM cinsinden - doğru calculation
    const earnedXLM = elapsed * stream.ratePerSecond; // XLM earned (rate artık XLM/sec)
    const totalXLM = stream.totalAmount; // Already in XLM
    const withdrawnXLM = stream.withdrawnAmount; // Already in XLM
    
    const earned = Math.min(earnedXLM, totalXLM);
    const available = Math.max(0, earned - withdrawnXLM);
    
    // Debug logging
    console.log(`📊 Available Amount Debug (Stream ${stream.id}):`);
    console.log(`  Current time: ${now}`);
    console.log(`  Stream start: ${stream.startTime}`);
    console.log(`  Elapsed: ${elapsed} seconds`);
    console.log(`  Rate: ${stream.ratePerSecond} XLM/sec`);
    console.log(`  Total: ${stream.totalAmount} XLM`);
    console.log(`  Withdrawn: ${stream.withdrawnAmount} XLM`);
    console.log(`  Earned: ${earned.toFixed(2)} XLM`);
    console.log(`  Available: ${available.toFixed(2)} XLM`);
    
    return available;
  };

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Stream kategorileri
  const activeStreams = streams.filter(s => s.isActive && !s.isPaused);
  const pausedStreams = streams.filter(s => s.isActive && s.isPaused);
  const inactiveStreams = streams.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="mr-3 text-green-600" />
            Salary Streaming
          </h2>
          
          {/* Freighter Status Panel - FreighterWalletDocs.md style */}
          <div className="bg-gray-50 rounded-lg p-4 min-w-96">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Wallet Status:</span> 
                <span>{freighterStatus}</span>
              </div>
              
              {freighterConnected && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Connected:</span> 
                    <span className="text-green-600">✅ Yes</span>
                  </div>
                  
                  {freighterAllowed && userAddress && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Address:</span> 
                        <span className="font-mono text-xs">{userAddress.substring(0, 12)}...</span>
                      </div>
                      
                      {networkInfo && (
                        <div className="flex justify-between">
                          <span className="font-medium">Network:</span> 
                          <span className="text-blue-600">{networkInfo.network || 'Unknown'}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              
              <div className="flex items-center space-x-2">
                {!freighterAllowed && freighterConnected && (
                    <button
                      onClick={requestFreighterAccess}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Request Access
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      window.location.reload();
                      // Real-time refresh
                      setTimeout(() => {
                        loadStreams();
                      }, 100);
                    }}
                    className="p-1 text-gray-600 hover:text-blue-600 rounded"
                    title="Refresh streams and balances"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streams Overview */}
        {streams.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Active Streams</p>
                  <p className="text-2xl font-semibold text-green-900">{activeStreams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Paused Streams</p>
                  <p className="text-2xl font-semibold text-yellow-900">{pausedStreams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg">
                  <StopCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Inactive Streams</p>
                  <p className="text-2xl font-semibold text-red-900">{inactiveStreams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Available</p>
                  <p className="text-2xl font-semibold text-blue-900">
                    {activeStreams.reduce((sum, s) => sum + getAvailableAmount(s), 0).toFixed(2)} XLM
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create New Stream - Only for specific address */}
        {userAddress === 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA' && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Stream</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            </div>
            <button
              onClick={createStream}
              disabled={isCreating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Stream'}
            </button>
          </div>
        )}

        {/* Active Streams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-700">✅ Active Streams</h3>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm">
              {activeStreams.length} active
            </span>
          </div>
          {activeStreams.length === 0 ? (
            <p className="text-gray-500">No active streams</p>
          ) : (
            activeStreams.map((stream) => {
              const available = getAvailableAmount(stream);
              const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

              return (
                <div key={stream.id} className="border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
                        <div className="flex gap-1">
                          {stream.isActive ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              ✅ Active
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                              ❌ Inactive
                            </span>
                          )}
                          {stream.isPaused && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              ⏸️ Paused
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Employee: {stream.employee}</p>
                      <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
                      <p className="text-sm text-gray-600">Rate: {stream.ratePerSecond.toFixed(2)} XLM/sec</p>
                    </div>
                    
                    <div>
                      {/* Withdrawal Progress */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm">
                          <span>Withdrawal Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Time Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm">
                          <span>Time Progress</span>
                          <span>{(() => {
                            const now = Math.floor(Date.now() / 1000);
                            const elapsed = Math.max(0, now - stream.startTime);
                            const timeProgress = Math.min((elapsed / stream.duration) * 100, 100);
                            return timeProgress.toFixed(1) + '%';
                          })()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(() => {
                              const now = Math.floor(Date.now() / 1000);
                              const elapsed = Math.max(0, now - stream.startTime);
                              const timeProgress = Math.min((elapsed / stream.duration) * 100, 100);
                              return timeProgress;
                            })()}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Enhanced Balance Info */}
                      <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available Now:</span>
                          <span className="font-semibold text-green-600">{available.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Already Withdrawn:</span>
                          <span className="font-medium text-blue-600">{stream.withdrawnAmount.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span className="text-gray-600">Remaining Total:</span>
                          <span className="font-medium text-gray-900">{(stream.totalAmount - stream.withdrawnAmount).toFixed(2)} XLM</span>
                        </div>
                      </div>
                      
                      {/* Withdraw Controls - Only for employees and NOT for special address */}
                      {stream.employee === publicKey && userAddress !== 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Amount"
                              value={withdrawAmounts[stream.id] || ''}
                              onChange={(e) => setWithdrawAmounts(prev => ({
                                ...prev,
                                [stream.id]: e.target.value
                              }))}
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              step="0.01"
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
                            className="w-full bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Withdraw All Available
                          </button>
                        </div>
                      )}
                      
                      {/* Stream Management - Only for Employer */}
                      {stream.employer === publicKey && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => pauseStream(stream.id)}
                            className="flex-1 bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700"
                          >
                            ⏸️ Pause
                          </button>
                          <button
                            onClick={() => endStream(stream.id)}
                            className="flex-1 bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
                          >
                            🔒 End
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <Clock className="inline w-4 h-4 mr-1" />
                      Duration: {formatTime(stream.duration)}
                    </div>
                    <div>
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                      Withdrawn: {stream.withdrawnAmount.toFixed(2)} XLM
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

        {/* Paused Streams */}
        {pausedStreams.length > 0 && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-700">⏸️ Paused Streams</h3>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-sm">
                {pausedStreams.length} paused
              </span>
            </div>
            {pausedStreams.map((stream) => {
              const available = getAvailableAmount(stream);
              const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

              return (
                <div key={stream.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          ⏸️ Paused
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Employee: {stream.employee}</p>
                      <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
                      <p className="text-sm text-gray-600">Rate: {stream.ratePerSecond.toFixed(2)} XLM/sec</p>
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Enhanced Balance Info for Paused Streams */}
                      <div className="bg-yellow-100 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available (Paused):</span>
                          <span className="font-semibold text-yellow-700">{available.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Already Withdrawn:</span>
                          <span className="font-medium text-blue-600">{stream.withdrawnAmount.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-yellow-300 pt-1">
                          <span className="text-gray-600">Remaining Total:</span>
                          <span className="font-medium text-gray-900">{(stream.totalAmount - stream.withdrawnAmount).toFixed(2)} XLM</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-yellow-700">
                          ⚠️ Stream is paused. Resume to continue earning.
                        </p>
                        
                        {/* Resume/End Controls - Only for Employer */}
                        {stream.employer === publicKey && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => resumeStream(stream.id)}
                              className="flex-1 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                            >
                              ▶️ Resume
                            </button>
                            <button
                              onClick={() => endStream(stream.id)}
                              className="flex-1 bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
                            >
                              🔒 End
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inactive Streams */}
        {inactiveStreams.length > 0 && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-700">❌ Inactive Streams</h3>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-sm">
                {inactiveStreams.length} inactive
              </span>
            </div>
            {inactiveStreams.map((stream) => {
              const available = getAvailableAmount(stream);
              const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

              return (
                <div key={stream.id} className="border rounded-lg p-4 bg-red-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          ❌ Inactive
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Employee: {stream.employee}</p>
                      <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
                      <p className="text-sm text-gray-600">Rate: {stream.ratePerSecond.toFixed(2)} XLM/sec</p>
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm">
                          <span>Final Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Final Balance Info for Inactive Streams */}
                      <div className="bg-red-100 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Final Withdrawn:</span>
                          <span className="font-semibold text-red-700">{stream.withdrawnAmount.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Allocated:</span>
                          <span className="font-medium text-gray-600">{stream.totalAmount.toFixed(2)} XLM</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-red-300 pt-1">
                          <span className="text-gray-600">Unutilized:</span>
                          <span className="font-medium text-red-800">{(stream.totalAmount - stream.withdrawnAmount).toFixed(2)} XLM</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-red-700">
                          🔒 Stream has ended. No more earnings available.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
 
  );
}
