'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Play, StopCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { salaryStreamingMethods, lendingMethods, signAndSubmitTransaction } from '../../lib/stellar-working';
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
  pausedAvailableAmount?: number; // Store the available amount when paused
}

interface Loan {
  id: number;
  borrower: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Repaid' | 'Defaulted';
  riskTier: number;
  interestRate: number;
  createdAt: Date;
  repaidAmount: number;
  collateralStreamId: number;
}

// Helper function to convert Soroban enum status to string
const getStatusString = (status: unknown): 'Pending' | 'Approved' | 'Repaid' | 'Defaulted' => {
  if (typeof status === 'string') return status as 'Pending' | 'Approved' | 'Repaid' | 'Defaulted';
  if (typeof status === 'object' && status !== null) {
    // Soroban enums are returned as objects with a property name matching the variant
    if ('Pending' in status) return 'Pending';
    if ('Approved' in status) return 'Approved';
    if ('Repaid' in status) return 'Repaid';
    if ('Defaulted' in status) return 'Defaulted';
    // If it's an array, take the first element as the variant name
    if (Array.isArray(status) && status.length > 0) {
      return status[0] as 'Pending' | 'Approved' | 'Repaid' | 'Defaulted';
    }
  }
  // Default fallback
  return 'Pending';
};

export default function StreamSection({ publicKey }: StreamSectionProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pausedAvailableAmounts, setPausedAvailableAmounts] = useState<{ [key: number]: number }>({});
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

  // Lending states
  const [loanAmount, setLoanAmount] = useState('');
  const [riskTier, setRiskTier] = useState(3);
  const [collateralStreamId, setCollateralStreamId] = useState('');
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);
  const [isApprovingLoan, setIsApprovingLoan] = useState<number | null>(null);
  const [isRejectingLoan, setIsRejectingLoan] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showLendingSection, setShowLendingSection] = useState(false);
  
  // Repayment states
  const [repaymentAmounts, setRepaymentAmounts] = useState<{ [key: number]: string }>({});
  const [isRepayingLoan, setIsRepayingLoan] = useState<number | null>(null);

  // Check if current user is admin
  const isAdmin = userAddress === 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA';

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
          const parsedStreams = allStreamData.map((stream: Record<string, unknown>) => ({
            id: stream.id as number,
            employer: stream.employer as string,
            employee: stream.employee as string,
            totalAmount: parseInt(stream.total_amount as string) / 10000000, // stroops to XLM
            ratePerSecond: parseInt(stream.rate_per_second as string) / 10000000, // stroops/sec to XLM/sec
            startTime: parseInt(stream.start_time as string),
            duration: parseInt(stream.duration_seconds as string),
            withdrawnAmount: parseInt(stream.withdrawn_amount as string) / 10000000, // stroops to XLM
            isActive: stream.is_active as boolean,
            isPaused: stream.is_paused as boolean
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
    setPausedAvailableAmounts({});
    
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
    // Inactive streams have no available amount
    if (!stream.isActive) {
      return 0;
    }
    
    // For paused streams, return the frozen available amount
    if (stream.isPaused) {
      // If we have a stored paused amount for this stream, use it
      const storedPausedAmount = pausedAvailableAmounts[stream.id];
      if (storedPausedAmount !== undefined) {
        console.log(`📊 Available Amount Debug - PAUSED (Stream ${stream.id}):`);
        console.log(`  Stream status: Active=${stream.isActive}, Paused=${stream.isPaused}`);
        console.log(`  Frozen available: ${storedPausedAmount.toFixed(2)} XLM`);
        return storedPausedAmount;
      }
      
      // If no stored amount, calculate current available and store it
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - stream.startTime);
      const earnedXLM = elapsed * stream.ratePerSecond;
      const totalXLM = stream.totalAmount;
      const withdrawnXLM = stream.withdrawnAmount;
      const earned = Math.min(earnedXLM, totalXLM);
      const currentAvailable = Math.max(0, earned - withdrawnXLM);
      
      // Store this amount for future use
      setPausedAvailableAmounts(prev => ({
        ...prev,
        [stream.id]: currentAvailable
      }));
      
      console.log(`📊 Available Amount Debug - NEWLY PAUSED (Stream ${stream.id}):`);
      console.log(`  Stream status: Active=${stream.isActive}, Paused=${stream.isPaused}`);
      console.log(`  Calculated and frozen available: ${currentAvailable.toFixed(2)} XLM`);
      
      return currentAvailable;
    }
    
    // For active (non-paused) streams, calculate normally and clear any stored paused amount
    if (pausedAvailableAmounts[stream.id] !== undefined) {
      setPausedAvailableAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[stream.id];
        return newAmounts;
      });
    }
    
    const now = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, now - stream.startTime);
    
    // Artık her şey XLM cinsinden - doğru calculation
    const earnedXLM = elapsed * stream.ratePerSecond; // XLM earned (rate artık XLM/sec)
    const totalXLM = stream.totalAmount; // Already in XLM
    const withdrawnXLM = stream.withdrawnAmount; // Already in XLM
    
    const earned = Math.min(earnedXLM, totalXLM);
    const available = Math.max(0, earned - withdrawnXLM);
    
    // Debug logging for active streams
    console.log(`📊 Available Amount Debug - ACTIVE (Stream ${stream.id}):`);
    console.log(`  Stream status: Active=${stream.isActive}, Paused=${stream.isPaused}`);
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

  // Load loans function
  const loadLoans = useCallback(async () => {
    if (!userAddress) {
      console.log('🔍 User address not available yet, skipping loan load');
      return;
    }
    
    try {
      console.log('🌐 Loading loans...');
      
      let allLoans: Loan[] = [];
      
      if (isAdmin) {
        // Admin can see all loans (no personal loans)
        console.log('👑 Admin loading all loans for management...');
        const allLoanData = await lendingMethods.getAllLoans();
        console.log('✅ All loans loaded:', allLoanData);
        
        if (allLoanData && Array.isArray(allLoanData)) {
          allLoans = allLoanData.map((loan: Record<string, unknown>) => ({
            id: loan.id as number,
            borrower: loan.borrower as string,
            amount: parseInt(loan.amount as string) / 10000000, // stroops to XLM
            status: getStatusString(loan.status),
            riskTier: loan.risk_tier as number,
            interestRate: loan.interest_rate as number,
            createdAt: new Date(parseInt(loan.created_at as string) * 1000),
            repaidAmount: parseInt(loan.repaid_amount as string) / 10000000, // stroops to XLM
            collateralStreamId: loan.collateral_stream_id as number
          }));
        }
      } else {
        // Regular users can only see their own loans
        console.log('👤 User loading own loans...');
        const userLoanIds = await lendingMethods.getBorrowerLoans(userAddress);
        console.log('✅ User loan IDs:', userLoanIds);
        
        if (userLoanIds && Array.isArray(userLoanIds)) {
          for (const loanId of userLoanIds) {
            try {
              const loan = await lendingMethods.getLoan(loanId);
              if (loan) {
                allLoans.push({
                  id: loan.id,
                  borrower: loan.borrower,
                  amount: parseInt(loan.amount) / 10000000, // stroops to XLM
                  status: getStatusString(loan.status),
                  riskTier: loan.risk_tier,
                  interestRate: loan.interest_rate,
                  createdAt: new Date(parseInt(loan.created_at) * 1000),
                  repaidAmount: parseInt(loan.repaid_amount) / 10000000, // stroops to XLM
                  collateralStreamId: loan.collateral_stream_id
                });
              }
            } catch (error) {
              console.error(`Failed to load loan ${loanId}:`, error);
            }
          }
        }
      }
      
      console.log('✅ Total loans loaded:', allLoans);
      setLoans(allLoans);
      
    } catch (error) {
      console.error('❌ Failed to load loans:', error);
      setLoans([]);
    }
  }, [userAddress, isAdmin]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Lending functions
  const requestLoan = async () => {
    if (!loanAmount || !collateralStreamId) {
      alert('Please fill all fields');
      return;
    }

    setIsRequestingLoan(true);
    try {
      const amountInStroops = parseFloat(loanAmount) * 10000000;
      const streamId = parseInt(collateralStreamId);

      const xdr = await lendingMethods.requestLoan(
        amountInStroops,
        riskTier,
        streamId,
        userAddress
      );

      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`✅ Loan request submitted!\n\n💰 Amount: ${loanAmount} XLM\n📊 Risk Tier: ${riskTier}\n🔗 Collateral Stream: ${streamId}`);
        
        // Clear form
        setLoanAmount('');
        setCollateralStreamId('');
        
        // Reload loans
        await loadLoans();
      }
    } catch (error) {
      console.error('Failed to request loan:', error);
      alert('Failed to request loan. Please try again.');
    } finally {
      setIsRequestingLoan(false);
    }
  };

  const approveLoan = async (loanId: number) => {
    if (!isAdmin) {
      alert('Only admin can approve loans');
      return;
    }

    setIsApprovingLoan(loanId);
    try {
      const xdr = await lendingMethods.approveLoan(loanId, userAddress);

      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`✅ Loan ${loanId} approved successfully!`);
        
        // Reload loans
        await loadLoans();
      }
    } catch (error) {
      console.error('Failed to approve loan:', error);
      alert('Failed to approve loan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsApprovingLoan(null);
    }
  };

  const rejectLoan = async (loanId: number) => {
    if (!isAdmin) {
      alert('Only admin can reject loans');
      return;
    }

    const reason = rejectReason.trim();
    if (!reason) {
      alert('Please enter a rejection reason');
      return;
    }

    setIsRejectingLoan(loanId);
    try {
      // const xdr = await lendingMethods.rejectLoan(loanId, reason, userAddress);
const xdr = await lendingMethods.rejectLoan(loanId,publicKey);
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`✅ Loan ${loanId} rejected successfully!\n\nReason: ${reason}`);
        
        // Clear reject reason
        setRejectReason('');
        
        // Reload loans
        await loadLoans();
      }
    } catch (error) {
      console.error('Failed to reject loan:', error);
      alert('Failed to reject loan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRejectingLoan(null);
    }
  };

  const repayLoan = async (loanId: number) => {
    const repaymentAmount = repaymentAmounts[loanId];
    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      alert('Please enter a valid repayment amount');
      return;
    }

    setIsRepayingLoan(loanId);
    try {
      const amountInStroops = parseFloat(repaymentAmount) * 10000000; // XLM to stroops

      const xdr = await lendingMethods.repayLoan(loanId, amountInStroops, userAddress);

      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`✅ Loan repayment successful!\n\n💰 Amount: ${repaymentAmount} XLM\n🆔 Loan ID: ${loanId}`);
        
        // Clear repayment amount
        setRepaymentAmounts(prev => ({
          ...prev,
          [loanId]: ''
        }));
        
        // Reload loans
        await loadLoans();
      }
    } catch (error) {
      console.error('Failed to repay loan:', error);
      alert('Failed to repay loan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRepayingLoan(null);
    }
  };

  const repayFullLoan = async (loanId: number, remainingAmount: number) => {
    setIsRepayingLoan(loanId);
    try {
      const amountInStroops = remainingAmount * 10000000; // XLM to stroops

      const xdr = await lendingMethods.repayLoan(loanId, amountInStroops, userAddress);

      if (xdr) {
        await signAndSubmitTransaction(xdr);
        alert(`✅ Loan fully repaid!\n\n💰 Amount: ${remainingAmount.toFixed(2)} XLM\n🆔 Loan ID: ${loanId}\n🎉 Loan is now REPAID!`);
        
        // Clear repayment amount
        setRepaymentAmounts(prev => ({
          ...prev,
          [loanId]: ''
        }));
        
        // Reload loans
        await loadLoans();
      }
    } catch (error) {
      console.error('Failed to repay loan:', error);
      alert('Failed to repay loan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRepayingLoan(null);
    }
  };

  // Stream kategorileri
  const activeStreams = streams.filter(s => s.isActive && !s.isPaused);
  const pausedStreams = streams.filter(s => s.isActive && s.isPaused);
  const inactiveStreams = streams.filter(s => !s.isActive);

  // Loan kategorileri
  const pendingLoans = loans.filter(l => l.status === 'Pending');
  const approvedLoans = loans.filter(l => l.status === 'Approved');
  const repaidLoans = loans.filter(l => l.status === 'Repaid');
  const defaultedLoans = loans.filter(l => l.status === 'Defaulted');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLendingSection(!showLendingSection)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showLendingSection 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💰 Lending {showLendingSection ? '(Active)' : ''}
            </button>
            <span className="text-sm text-gray-500">
              {isAdmin ? '👑 Admin Panel' : '👤 User Panel'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 ml-auto">
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
                    loadLoans();
                  }, 100);
                }}
                className="p-1 text-gray-600 hover:text-blue-600 rounded"
                title="Refresh streams and balances"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
        </div>

        {/* Lending Section */}
        {showLendingSection && (
          <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-purple-900">
                {isAdmin ? '👑 Admin Lending Dashboard' : '💰 Lending Platform'}
              </h3>
              {isAdmin && (
                <p className="text-sm text-purple-700 mt-1">
                  Manage loan applications, approve/reject requests, and monitor repayments
                </p>
              )}
            </div>
            
            {/* Loan Overview */}
            {loans.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Pending Loans</p>
                      <p className="text-2xl font-semibold text-yellow-900">{pendingLoans.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Approved Loans</p>
                      <p className="text-2xl font-semibold text-green-900">{approvedLoans.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Repaid Loans</p>
                      <p className="text-2xl font-semibold text-blue-900">{repaidLoans.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <StopCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">Defaulted</p>
                      <p className="text-2xl font-semibold text-red-900">{defaultedLoans.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Request Loan Form - Only for regular users */}
            {!isAdmin && (
              <div className="mb-8 p-4 bg-white rounded-lg border">
                <h4 className="text-lg font-semibold mb-4">📝 Request New Loan</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Loan Amount (XLM)"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={riskTier}
                    onChange={(e) => setRiskTier(parseInt(e.target.value))}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>Risk Tier 1 (4.0% APR)</option>
                    <option value={2}>Risk Tier 2 (4.5% APR)</option>
                    <option value={3}>Risk Tier 3 (5.0% APR)</option>
                    <option value={4}>Risk Tier 4 (5.5% APR)</option>
                    <option value={5}>Risk Tier 5 (6.0% APR)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Collateral Stream ID"
                    value={collateralStreamId}
                    onChange={(e) => setCollateralStreamId(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={requestLoan}
                    disabled={isRequestingLoan}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isRequestingLoan ? 'Requesting...' : 'Request Loan'}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  💡 Tip: Use one of your active streams as collateral. Higher risk tiers have higher interest rates.
                </p>
              </div>
            )}

            {/* Loans List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-purple-700">
                  {isAdmin ? '👑 Loan Management Dashboard' : '👤 Your Loans'}
                </h4>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-sm">
                  {loans.length} {isAdmin ? 'total loans' : 'your loans'}
                </span>
              </div>

              {loans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {isAdmin 
                      ? "📋 No loan applications yet. Users can request loans using their salary streams as collateral." 
                      : "📝 No loans found. Request a new loan using your active streams as collateral."
                    }
                  </p>
                </div>
              ) : (
                loans.map((loan) => (
                  <div key={loan.id} className={`border rounded-lg p-4 ${
                    loan.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' :
                    loan.status === 'Approved' ? 'bg-green-50 border-green-200' :
                    loan.status === 'Repaid' ? 'bg-blue-50 border-blue-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold text-gray-900">Loan #{loan.id}</h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            loan.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            loan.status === 'Repaid' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {loan.status === 'Pending' ? '⏳ Pending' :
                             loan.status === 'Approved' ? '✅ Approved' :
                             loan.status === 'Repaid' ? '💚 Repaid' :
                             '❌ Defaulted'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Borrower: {loan.borrower}</p>
                        <p className="text-sm text-gray-600">Amount: {loan.amount.toFixed(2)} XLM</p>
                        <p className="text-sm text-gray-600">Risk Tier: {loan.riskTier} ({(loan.interestRate / 100).toFixed(1)}% APR)</p>
                        <p className="text-sm text-gray-600">Collateral Stream: #{loan.collateralStreamId}</p>
                      </div>
                      
                      <div>
                        <div className="bg-white p-3 rounded-lg space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Requested:</span>
                            <span className="font-semibold">{loan.amount.toFixed(2)} XLM</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Repaid:</span>
                            <span className="font-medium text-blue-600">{loan.repaidAmount.toFixed(2)} XLM</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-1">
                            <span className="text-gray-600">Remaining:</span>
                            <span className="font-medium text-gray-900">{(loan.amount - loan.repaidAmount).toFixed(2)} XLM</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Created:</span>
                            <span className="text-xs text-gray-500">{loan.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Admin Controls - Only for pending loans from OTHER users */}
                        {isAdmin && loan.status === 'Pending' && loan.borrower !== userAddress && (
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveLoan(loan.id)}
                                disabled={isApprovingLoan === loan.id}
                                className="flex-1 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {isApprovingLoan === loan.id ? 'Approving...' : '✅ Approve'}
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border rounded"
                              />
                              <button
                                onClick={() => rejectLoan(loan.id)}
                                disabled={isRejectingLoan === loan.id || !rejectReason.trim()}
                                className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                {isRejectingLoan === loan.id ? 'Rejecting...' : '❌ Reject'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Note for admin's own loans (if any) */}
                        {isAdmin && loan.borrower === userAddress && (
                          <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded-lg">
                            <p className="text-sm text-gray-600">
                              👤 This is your personal loan. Switch to user mode to manage it.
                            </p>
                          </div>
                        )}

                        {/* Status Messages */}
                        {loan.status === 'Pending' && !isAdmin && (
                          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <p className="text-sm text-yellow-700">
                              ⏳ Loan is pending admin approval. Please wait for review.
                            </p>
                          </div>
                        )}

                        {loan.status === 'Approved' && (
                          <div className="mt-3 space-y-3">
                            <div className="p-2 bg-green-100 border border-green-300 rounded-lg">
                              <p className="text-sm text-green-700">
                                ✅ Loan approved! You can start using the funds.
                              </p>
                            </div>
                            
                            {/* Repayment Controls - Only for borrower */}
                            {loan.borrower === userAddress && (loan.amount - loan.repaidAmount) > 0 && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h6 className="text-sm font-semibold text-blue-800 mb-2">💳 Repay Loan</h6>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      placeholder="Amount (XLM)"
                                      step="0.1"
                                      min="0.1"
                                      max={(loan.amount - loan.repaidAmount).toFixed(2)}
                                      value={repaymentAmounts[loan.id] || ''}
                                      onChange={(e) => setRepaymentAmounts(prev => ({
                                        ...prev,
                                        [loan.id]: e.target.value
                                      }))}
                                      className="flex-1 px-2 py-1 text-sm border rounded"
                                    />
                                    <button
                                      onClick={() => repayLoan(loan.id)}
                                      disabled={isRepayingLoan === loan.id || !repaymentAmounts[loan.id]}
                                      className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {isRepayingLoan === loan.id ? 'Paying...' : '💳 Repay'}
                                    </button>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => repayFullLoan(loan.id, loan.amount - loan.repaidAmount)}
                                      disabled={isRepayingLoan === loan.id}
                                      className="flex-1 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                      {isRepayingLoan === loan.id ? 'Processing...' : `💰 Pay Full (${(loan.amount - loan.repaidAmount).toFixed(2)} XLM)`}
                                    </button>
                                  </div>
                                  
                                  <p className="text-xs text-blue-600">
                                    💡 Remaining: {(loan.amount - loan.repaidAmount).toFixed(2)} XLM
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {loan.status === 'Repaid' && (
                          <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded-lg">
                            <p className="text-sm text-blue-700">
                              💚 Loan fully repaid! Thank you for your payment.
                            </p>
                          </div>
                        )}

                        {loan.status === 'Defaulted' && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm text-red-700">
                              ❌ Loan was rejected or defaulted.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
                      
                      {/* Withdraw Controls - Only for employees, NOT for special address, and NOT for paused streams */}
                      {stream.employee === publicKey && userAddress !== 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA' && !stream.isPaused && (
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
                      
                      {/* Paused stream withdrawal message */}
                      {stream.employee === publicKey && stream.isPaused && userAddress !== 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA' && (
                        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            ⏸️ Stream is paused. Available funds shown but withdrawals are disabled. Ask your employer to resume the stream.
                          </p>
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
    </div>
  );
}
