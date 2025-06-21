// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { DollarSign, Play, StopCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
// import { salaryStreamingMethods, signAndSubmitTransaction } from '../../lib/stellar-working';
// import {
//   isConnected,
//   isAllowed,
//   requestAccess,
//   getAddress,
//   getNetwork,
//   getNetworkDetails
// } from '@stellar/freighter-api';

// interface StreamSectionProps {
//   publicKey: string;
// }

// interface Stream {
//   id: number;
//   employer: string;
//   employee: string;
//   totalAmount: number;
//   ratePerSecond: number;
//   startTime: number;
//   duration: number;
//   withdrawnAmount: number;
//   isActive: boolean;
//   isPaused: boolean;
// }

// export default function StreamSection({ publicKey }: StreamSectionProps) {
//   const [streams, setStreams] = useState<Stream[]>([]);
//   const [freighterStatus, setFreighterStatus] = useState<string>('checking...');
//   const [freighterConnected, setFreighterConnected] = useState(false);
//   const [freighterAllowed, setFreighterAllowed] = useState(false);
//   const [userAddress, setUserAddress] = useState<string>('');
//   const [networkInfo, setNetworkInfo] = useState<any>(null);
//   const [devMode, setDevMode] = useState(false);
//   const [isCreating, setIsCreating] = useState(false);
//   const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
//   const [withdrawAmounts, setWithdrawAmounts] = useState<{ [key: number]: string }>({});
//   const [newStream, setNewStream] = useState({
//     employee: '',
//     amount: '',
//     duration: ''
//   });

//   const loadStreams = useCallback(async () => {
//     try {
//       // Mock data for now - replace with actual contract calls
//       setStreams([
//         {
//           id: 1,
//           employer: publicKey,
//           employee: 'GB2FXDYXQJD5DZX7X7X7X7X7X7X7X7X7X7X7X7X7X7X7X7X7',
//           totalAmount: 1000,
//           ratePerSecond: 0.001,
//           startTime: Date.now() - 86400000, // 1 day ago
//           duration: 2592000, // 30 days
//           withdrawnAmount: 100,
//           isActive: true,
//           isPaused: false
//         }
//       ]);
//     } catch (error) {
//       console.error('Failed to load streams:', error);
//     }
//   }, [publicKey]);

//   useEffect(() => {
//     loadStreams();
//   }, [loadStreams]);

//   // FreighterWalletDocs.md'e göre Freighter detection
//   useEffect(() => {
//     const checkFreighterStep = async () => {
//       try {
//         console.log('🔍 Step 1: Checking if Freighter is connected...');
        
//         // Step 1: Check if Freighter is connected (isConnected)
//         const connectionResult = await isConnected();
//         console.log('Connection result:', connectionResult);
        
//         if (connectionResult.isConnected) {
//           setFreighterConnected(true);
//           setFreighterStatus('✅ Freighter connected');
          
//           console.log('🔍 Step 2: Checking if app is allowed...');
          
//           // Step 2: Check if the user authorized your app (isAllowed)
//           const allowedResult = await isAllowed();
//           console.log('Allowed result:', allowedResult);
          
//           if (allowedResult.isAllowed) {
//             setFreighterAllowed(true);
//             setFreighterStatus('✅ Freighter authorized');
            
//             console.log('🔍 Step 3: Getting public key...');
            
//             // Step 3: Get public key (getAddress)
//             const addressResult = await getAddress();
//             console.log('Address result:', addressResult);
            
//             if (addressResult.address) {
//               setUserAddress(addressResult.address);
//               setFreighterStatus(`✅ Connected: ${addressResult.address.substring(0, 8)}...`);
              
//               console.log('🔍 Step 4: Getting network info...');
              
//               // Step 4: Show network (getNetworkDetails)
//               const networkDetails = await getNetworkDetails();
//               console.log('Network details:', networkDetails);
//               setNetworkInfo(networkDetails);
              
//               setDevMode(false);
//             } else {
//               setFreighterStatus('⚠️ Could not get address');
//               setDevMode(true);
//             }
//           } else {
//             setFreighterStatus('⚠️ App not authorized');
//             setDevMode(true);
//           }
//         } else {
//           setFreighterConnected(false);
//           setFreighterStatus('❌ Freighter not connected');
//           setDevMode(true);
//         }
//       } catch (error) {
//         console.error('Freighter detection error:', error);
//         setFreighterStatus('❌ Freighter error');
//         setDevMode(true);
//       }
//     };

//     // Check immediately and after a delay
//     checkFreighterStep();
//     const timer = setTimeout(checkFreighterStep, 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   // Request access function (docs step 2)
//   const requestFreighterAccess = async () => {
//     try {
//       console.log('🔑 Requesting Freighter access...');
//       const result = await requestAccess();
//       console.log('Access result:', result);
      
//       if (result.address) {
//         setUserAddress(result.address);
//         setFreighterAllowed(true);
//         setFreighterStatus(`✅ Connected: ${result.address.substring(0, 8)}...`);
//         setDevMode(false);
        
//         // Also get network info
//         const networkDetails = await getNetworkDetails();
//         setNetworkInfo(networkDetails);
//       } else if (result.error) {
//         console.error('Access error:', result.error);
//         alert(`Failed to get access: ${result.error}`);
//       }
//     } catch (error) {
//       console.error('Request access failed:', error);
//       alert('Failed to request Freighter access');
//     }
//   };

//   const createStream = async () => {
//     if (!newStream.employee || !newStream.amount || !newStream.duration) {
//       alert('Please fill all fields');
//       return;
//     }

//     setIsCreating(true);
//     try {
//       const amountInStroops = parseFloat(newStream.amount) * 10000000;
//       const durationInSeconds = parseInt(newStream.duration) * 24 * 60 * 60; // days to seconds

//       const xdr = await salaryStreamingMethods.createStream(
//         publicKey,           // employer (string)
//         newStream.employee,  // employee (string)  
//         amountInStroops,     // total_amount (number)
//         durationInSeconds    // duration_seconds (number)
//       );

//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
        
//         // Add to local state
//         const newStreamObj: Stream = {
//           id: streams.length + 1,
//           employer: publicKey,
//           employee: newStream.employee,
//           totalAmount: parseFloat(newStream.amount),
//           ratePerSecond: amountInStroops / durationInSeconds,
//           startTime: Date.now(),
//           duration: durationInSeconds,
//           withdrawnAmount: 0,
//           isActive: true,
//           isPaused: false
//         };
        
//         setStreams([...streams, newStreamObj]);
//         setNewStream({ employee: '', amount: '', duration: '' });
//       }
//     } catch (error) {
//       console.error('Failed to create stream:', error);
//       alert('Failed to create stream. Please try again.');
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const withdrawPartial = async (streamId: number) => {
//     const withdrawAmount = withdrawAmounts[streamId];
//     if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
//       alert('Please enter a valid amount');
//       return;
//     }

//     const stream = streams.find(s => s.id === streamId);
//     if (!stream) return;

//     const available = getAvailableAmount(stream);
//     if (parseFloat(withdrawAmount) > available) {
//       alert(`Insufficient available balance. Available: ${available.toFixed(7)} XLM`);
//       return;
//     }

//     setIsWithdrawing(streamId);
//     try {
//       const amountInStroops = parseFloat(withdrawAmount) * 10000000;
      
//       const xdr = await salaryStreamingMethods.withdraw(
//         streamId, 
//         amountInStroops, 
//         publicKey
//       );
      
//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
        
//         // Update local state
//         setStreams(streams.map(stream => 
//           stream.id === streamId 
//             ? { ...stream, withdrawnAmount: stream.withdrawnAmount + parseFloat(withdrawAmount) }
//             : stream
//         ));
        
//         // Clear the withdraw amount input
//         setWithdrawAmounts(prev => ({
//           ...prev,
//           [streamId]: ''
//         }));
        
//         alert(`Successfully withdrawn ${withdrawAmount} XLM`);
//       }
//     } catch (error) {
//       console.error('Failed to withdraw:', error);
//       const errorMessage = error instanceof Error ? error.message : 'Please try again.';
//       alert(`Failed to withdraw: ${errorMessage}`);
//     } finally {
//       setIsWithdrawing(null);
//     }
//   };

//   const withdrawAll = async (streamId: number) => {
//     const stream = streams.find(s => s.id === streamId);
//     if (!stream) return;

//     const available = getAvailableAmount(stream);
//     if (available <= 0) {
//       alert('No available amount to withdraw');
//       return;
//     }

//     setIsWithdrawing(streamId);
//     try {
//       // Convert available amount to stroops for contract call
//       const amountInStroops = Math.floor(available * 10000000);
//       const xdr = await salaryStreamingMethods.withdraw(streamId, amountInStroops, publicKey);
      
//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
        
//         // Update local state
//         setStreams(streams.map(s => 
//           s.id === streamId 
//             ? { 
//                 ...s, 
//                 withdrawnAmount: s.withdrawnAmount + available
//               }
//             : s
//         ));
        
//         alert(`Successfully withdrawn ${available.toFixed(7)} XLM`);
//       }
//     } catch (error) {
//       console.error('Failed to withdraw:', error);
//       const errorMessage = error instanceof Error ? error.message : 'Please try again.';
//       alert(`Failed to withdraw: ${errorMessage}`);
//     } finally {
//       setIsWithdrawing(null);
//     }
//   };

//   const getAvailableAmount = (stream: Stream): number => {
//     const now = Date.now();
//     const elapsed = Math.max(0, now - stream.startTime) / 1000; // seconds
//     const earned = Math.min(elapsed * stream.ratePerSecond, stream.totalAmount);
//     return Math.max(0, earned - stream.withdrawnAmount);
//   };

//   const formatTime = (seconds: number): string => {
//     const days = Math.floor(seconds / 86400);
//     const hours = Math.floor((seconds % 86400) / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
    
//     if (days > 0) return `${days}d ${hours}h`;
//     if (hours > 0) return `${hours}h ${mins}m`;
//     return `${mins}m`;
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-bold text-gray-900 flex items-center">
//             <DollarSign className="mr-3 text-green-600" />
//             Salary Streaming
//           </h2>
          
//           {/* Freighter Status Panel - FreighterWalletDocs.md style */}
//           <div className="bg-gray-50 rounded-lg p-4 min-w-96">
//             <div className="text-sm space-y-2">
//               <div className="flex justify-between">
//                 <span className="font-medium">Wallet Status:</span> 
//                 <span>{freighterStatus}</span>
//               </div>
              
//               {freighterConnected && (
//                 <>
//                   <div className="flex justify-between">
//                     <span className="font-medium">Connected:</span> 
//                     <span className="text-green-600">✅ Yes</span>
//                   </div>
                  
//                   {freighterAllowed && userAddress && (
//                     <>
//                       <div className="flex justify-between">
//                         <span className="font-medium">Address:</span> 
//                         <span className="font-mono text-xs">{userAddress.substring(0, 12)}...</span>
//                       </div>
                      
//                       {networkInfo && (
//                         <div className="flex justify-between">
//                           <span className="font-medium">Network:</span> 
//                           <span className="text-blue-600">{networkInfo.network || 'Unknown'}</span>
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </>
//               )}
              
//               <div className="flex justify-between items-center">
//                 <span className="font-medium">Dev Mode:</span>
//                 <div className="flex items-center space-x-2">
//                   <button
//                     onClick={() => setDevMode(!devMode)}
//                     className={`px-2 py-1 text-xs rounded ${
//                       devMode 
//                         ? 'bg-orange-100 text-orange-800' 
//                         : 'bg-gray-100 text-gray-800'
//                     }`}
//                   >
//                     {devMode ? 'ON' : 'OFF'}
//                   </button>
                  
//                   {!freighterAllowed && freighterConnected && (
//                     <button
//                       onClick={requestFreighterAccess}
//                       className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
//                     >
//                       Request Access
//                     </button>
//                   )}
                  
//                   <button
//                     onClick={() => window.location.reload()}
//                     className="p-1 text-gray-600 hover:text-blue-600 rounded"
//                     title="Refresh"
//                   >
//                     <RefreshCw className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Create New Stream */}
//         <div className="mb-8 p-4 bg-gray-50 rounded-lg">
//           <h3 className="text-lg font-semibold mb-4">Create New Stream</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             <input
//               type="text"
//               placeholder="Employee Address"
//               value={newStream.employee}
//               onChange={(e) => setNewStream({ ...newStream, employee: e.target.value })}
//               className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//             <input
//               type="number"
//               placeholder="Amount (XLM)"
//               value={newStream.amount}
//               onChange={(e) => setNewStream({ ...newStream, amount: e.target.value })}
//               className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//             <input
//               type="number"
//               placeholder="Duration (days)"
//               value={newStream.duration}
//               onChange={(e) => setNewStream({ ...newStream, duration: e.target.value })}
//               className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <button
//             onClick={createStream}
//             disabled={isCreating}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//           >
//             {isCreating ? 'Creating...' : 'Create Stream'}
//           </button>
//         </div>

//         {/* Active Streams */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">Active Streams</h3>
//           {streams.length === 0 ? (
//             <p className="text-gray-500">No active streams</p>
//           ) : (
//             streams.map((stream) => {
//               const available = getAvailableAmount(stream);
//               const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

//               return (
//                 <div key={stream.id} className="border rounded-lg p-4 bg-white">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
//                       <p className="text-sm text-gray-600">Employee: {stream.employee}</p>
//                       <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
//                       <p className="text-sm text-gray-600">Rate: {stream.ratePerSecond.toFixed(7)} XLM/sec</p>
//                     </div>
                    
//                     <div>
//                       <div className="mb-2">
//                         <div className="flex justify-between text-sm">
//                           <span>Progress</span>
//                           <span>{progress.toFixed(1)}%</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <div 
//                             className="bg-green-600 h-2 rounded-full" 
//                             style={{ width: `${Math.min(progress, 100)}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <p className="text-sm font-medium text-green-600">
//                         Available: {available.toFixed(7)} XLM
//                       </p>
                      
//                       {/* Withdraw Controls */}
//                       <div className="mt-3 space-y-2">
//                         <div className="flex gap-2">
//                           <input
//                             type="number"
//                             placeholder="Amount"
//                             value={withdrawAmounts[stream.id] || ''}
//                             onChange={(e) => setWithdrawAmounts(prev => ({
//                               ...prev,
//                               [stream.id]: e.target.value
//                             }))}
//                             className="flex-1 px-2 py-1 text-sm border rounded"
//                             step="0.0000001"
//                             max={available}
//                           />
//                           <button
//                             onClick={() => withdrawPartial(stream.id)}
//                             disabled={isWithdrawing === stream.id}
//                             className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
//                           >
//                             {isWithdrawing === stream.id ? 'Withdrawing...' : 'Withdraw'}
//                           </button>
//                         </div>
                        
//                         <button
//                           onClick={() => withdrawAll(stream.id)}
//                           disabled={isWithdrawing === stream.id || available <= 0}
//                           className="w-full bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50"
//                         >
//                           Withdraw All Available
//                         </button>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm text-gray-600">
//                     <div>
//                       <Clock className="inline w-4 h-4 mr-1" />
//                       Duration: {formatTime(stream.duration)}
//                     </div>
//                     <div>
//                       <TrendingUp className="inline w-4 h-4 mr-1" />
//                       Withdrawn: {stream.withdrawnAmount.toFixed(7)} XLM
//                     </div>
//                     <div className="flex items-center">
//                       {stream.isActive ? (
//                         <><Play className="w-4 h-4 mr-1 text-green-600" /> Active</>
//                       ) : (
//                         <><StopCircle className="w-4 h-4 mr-1 text-red-600" /> Stopped</>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
