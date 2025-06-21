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
//     employee: 'GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A',
//     amount: '10',
//     duration: '2592000'
//   });

//   // Test modu - blockchain'e bağlı değil, sadece UI testi için
//   const [testMode, setTestMode] = useState(true); // Varsayılan olarak test modunda başla
//   const [testStreams, setTestStreams] = useState([
//     {
//       id: 1,
//       employer: "GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA", // Alice (employer)
//       employee: publicKey, // Current user as employee
//       totalAmount: 1000000000, // 100 XLM in stroops
//       ratePerSecond: 385,
//       startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
//       duration: 2592000, // 30 days
//       withdrawnAmount: 0,
//       isActive: true,
//       isPaused: false
//     },
//     {
//       id: 2,
//       employer: publicKey, // Current user as employer
//       employee: "GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A",
//       totalAmount: 500000000, // 50 XLM in stroops
//       ratePerSecond: 192,
//       startTime: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
//       duration: 1296000, // 15 days
//       withdrawnAmount: 1000000, // 0.1 XLM already withdrawn
//       isActive: true,
//       isPaused: false
//     },
//     {
//       id: 3,
//       employer: publicKey, // Current user as employer
//       employee: publicKey, // Current user as employee (self-payment test)
//       totalAmount: 2000000000, // 200 XLM in stroops
//       ratePerSecond: 1000,
//       startTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
//       duration: 2592000, // 30 days
//       withdrawnAmount: 5000000, // 0.5 XLM already withdrawn
//       isActive: true,
//       isPaused: false
//     }
//   ]);

//   const loadStreams = useCallback(async () => {
//     try {
//       if (testMode) {
//         // Test modunda: Yerel test verilerini kullan
//         console.log('📱 Test modunda - yerel stream verileri yükleniyor...');
//         setStreams(testStreams.map(stream => ({
//           ...stream,
//           totalAmount: stream.totalAmount / 10000000, // Stroops'u XLM'e çevir
//           withdrawnAmount: stream.withdrawnAmount / 10000000
//         })));
//         return;
//       }

//       // Gerçek mod: Blockchain'den veri çek
//       console.log('🌐 Gerçek modunda - blockchain verisi yükleniyor...');
      
//       if (!publicKey) {
//         console.log('❌ Public key yok, streamler yüklenemiyor');
//         setStreams([]);
//         return;
//       }

//       console.log('📥 Contract\'tan employee streams çekiliyor...', publicKey);
      
//       let allStreams: Stream[] = [];
      
//       // Employee olarak streams çek
//       try {
//         console.log('� Employee streams call başlıyor...');
//         const employeeStreams = await salaryStreamingMethods.getEmployeeStreams(publicKey);
//         console.log('✅ Employee streams başarılı:', employeeStreams);
        
//         // Employee streams'i parse et
//         if (employeeStreams && Array.isArray(employeeStreams)) {
//           const parsedEmployeeStreams = employeeStreams.map((stream: any) => ({
//             id: stream.id,
//             employer: stream.employer,
//             employee: stream.employee,
//             totalAmount: parseInt(stream.total_amount) / 10000000, // stroops to XLM
//             ratePerSecond: parseInt(stream.rate_per_second),
//             startTime: parseInt(stream.start_time),
//             duration: parseInt(stream.duration_seconds),
//             withdrawnAmount: parseInt(stream.withdrawn_amount) / 10000000, // stroops to XLM
//             isActive: stream.is_active,
//             isPaused: stream.is_paused
//           }));
//           allStreams = [...allStreams, ...parsedEmployeeStreams];
//           console.log(`✅ ${parsedEmployeeStreams.length} employee stream parsed`);
//         }
//       } catch (error) {
//         console.error('❌ Employee streams hata:', error);
//         // Employee streams hatası varsa devam et, employer streams'i dene
//       }
      
//       // Employer olarak stream ID'leri çek  
//       try {
//         console.log('🏢 Employer streams call başlıyor...');
//         const employerStreamIds = await salaryStreamingMethods.getEmployerStreams(publicKey);
//         console.log('✅ Employer stream IDs başarılı:', employerStreamIds);
        
//         // Employer streams'i de çek (ID'ler varsa)
//         if (employerStreamIds && Array.isArray(employerStreamIds)) {
//           for (const streamId of employerStreamIds) {
//             try {
//               console.log(`📋 Stream ${streamId} detayı çekiliyor...`);
//               const stream = await salaryStreamingMethods.getStream(streamId);
//               if (stream && !allStreams.find(s => s.id === stream.id)) {
//                 const parsedStream = {
//                   id: stream.id,
//                   employer: stream.employer,
//                   employee: stream.employee,
//                   totalAmount: parseInt(stream.total_amount) / 10000000,
//                   ratePerSecond: parseInt(stream.rate_per_second),
//                   startTime: parseInt(stream.start_time),
//                   duration: parseInt(stream.duration_seconds),
//                   withdrawnAmount: parseInt(stream.withdrawn_amount) / 10000000,
//                   isActive: stream.is_active,
//                   isPaused: stream.is_paused
//                 };
//                 allStreams.push(parsedStream);
//                 console.log(`✅ Stream ${streamId} eklendi`);
//               }
//             } catch (error) {
//               console.warn(`⚠️ Stream ${streamId} çekilemedi:`, error);
//             }
//           }
//           console.log(`✅ ${employerStreamIds.length} employer stream processed`);
//         }
//       } catch (error) {
//         console.error('❌ Employer streams hata:', error);
//         // Employer streams hatası varsa da devam et
//       }
      
//       console.log('✅ Toplam streams:', allStreams);
//       setStreams(allStreams);
      
//     } catch (error) {
//       console.error('❌ Failed to load streams:', error);
//       // Hata durumunda boş array set et
//       setStreams([]);
//     }
//   }, [publicKey, testMode, testStreams, salaryStreamingMethods]);

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
//     if (testMode) {
//       alert('🧪 Test modunda stream oluşturma devre dışı. Real moda geçin.');
//       return;
//     }

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

//     // Debug: Current user and stream info
//     console.log('🔍 Withdraw Debug Info:');
//     console.log('  Current publicKey:', publicKey);
//     console.log('  Stream employee:', stream.employee);
//     console.log('  Stream employer:', stream.employer);
//     console.log('  User is employee:', stream.employee === publicKey);
//     console.log('  Freighter address:', userAddress);
//     console.log('  Withdraw amount:', withdrawAmount);

//     // Check if current user is the employee of this stream
//     if (stream.employee !== publicKey) {
//       alert(`Only the employee can withdraw from this stream. You: ${publicKey}, Employee: ${stream.employee}`);
//       return;
//     }

//     const available = getAvailableAmount(stream);
//     if (parseFloat(withdrawAmount) > available) {
//       alert(`Insufficient available balance. Available: ${available.toFixed(7)} XLM`);
//       return;
//     }

//     setIsWithdrawing(streamId);
    
//     try {
//       if (testMode) {
//         // Test modu: Sadece UI güncellemesi yap
//         console.log('🧪 Test modunda withdraw simüle ediliyor...');
//         console.log(`💰 Çekilen miktar: ${withdrawAmount} XLM`);
//         console.log(`📊 Stream ID: ${streamId}`);
        
//         // 1 saniye bekle (gerçek transaction simulation)
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // Test streamları güncelle
//         setTestStreams(prev => prev.map(s => 
//           s.id === streamId 
//             ? { ...s, withdrawnAmount: s.withdrawnAmount + (parseFloat(withdrawAmount) * 10000000) }
//             : s
//         ));
        
//         // UI state'ini güncelle
//         setStreams(streams.map(stream => 
//           stream.id === streamId 
//             ? { ...stream, withdrawnAmount: stream.withdrawnAmount + parseFloat(withdrawAmount) }
//             : stream
//         ));
        
//         alert(`✅ Test modunda withdraw başarılı! ${withdrawAmount} XLM çekildi.`);
//       } else {
//         // Gerçek mod: Blockchain transaction
//         console.log('🌐 Gerçek modunda blockchain withdraw...');
//         const amountInStroops = parseFloat(withdrawAmount) * 10000000;
        
//         console.log('📋 Transaction Parameters:');
//         console.log('  Stream ID:', streamId);
//         console.log('  Amount (stroops):', amountInStroops);
//         console.log('  Amount (XLM):', withdrawAmount);
//         console.log('  Authorization address:', publicKey);
        
//         // Use the employee's (current user's) publicKey for authorization
//         const xdr = await salaryStreamingMethods.withdraw(
//           streamId, 
//           amountInStroops, 
//           publicKey  // This should be the employee's address
//         );
        
//         if (xdr) {
//           console.log('✅ XDR generated, signing...');
//           await signAndSubmitTransaction(xdr);
          
//           // Update local state
//           setStreams(streams.map(stream => 
//             stream.id === streamId 
//               ? { ...stream, withdrawnAmount: stream.withdrawnAmount + parseFloat(withdrawAmount) }
//               : stream
//           ));
          
//           alert(`Successfully withdrawn ${withdrawAmount} XLM`);
//         }
//       }
      
//       // Clear the withdraw amount input
//       setWithdrawAmounts(prev => ({
//         ...prev,
//         [streamId]: ''
//       }));
      
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
//       if (testMode) {
//         // Test modu: Tüm mevcut miktarı çek
//         console.log('🧪 Test modunda withdraw all simüle ediliyor...');
//         console.log(`💰 Çekilen miktar: ${available.toFixed(7)} XLM`);
//         console.log(`📊 Stream ID: ${streamId}`);
        
//         // 1 saniye bekle (gerçek transaction simulation)
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // Test streamları güncelle
//         setTestStreams(prev => prev.map(s => 
//           s.id === streamId 
//             ? { ...s, withdrawnAmount: s.withdrawnAmount + Math.floor(available * 10000000) }
//             : s
//         ));
        
//         // UI state'ini güncelle
//         setStreams(streams.map(s => 
//           s.id === streamId 
//             ? { 
//                 ...s, 
//                 withdrawnAmount: s.withdrawnAmount + available
//               }
//             : s
//         ));
        
//         alert(`✅ Test modunda withdraw all başarılı! ${available.toFixed(7)} XLM çekildi.`);
//       } else {
//         // Gerçek mod: Blockchain transaction
//         console.log('🌐 Gerçek modunda blockchain withdraw all...');
//        // Floating point hatalarını önlemek için biraz daha az çek
// const amountInStroops = Math.floor(available * 10000000 * 0.99);
//         const xdr = await salaryStreamingMethods.withdraw(streamId, amountInStroops, publicKey);
        
//         if (xdr) {
//           await signAndSubmitTransaction(xdr);
          
//           // Update local state
//           setStreams(streams.map(s => 
//             s.id === streamId 
//               ? { 
//                   ...s, 
//                   withdrawnAmount: s.withdrawnAmount + available
//                 }
//               : s
//           ));
          
//           alert(`Successfully withdrawn ${available.toFixed(7)} XLM`);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to withdraw:', error);
//       const errorMessage = error instanceof Error ? error.message : 'Please try again.';
//       alert(`Failed to withdraw: ${errorMessage}`);
//     } finally {
//       setIsWithdrawing(null);
//     }
//   };

//   const pauseStream = async (streamId: number) => {
//     if (testMode) {
//       alert('🧪 Test modunda stream yönetimi mevcut değil');
//       return;
//     }
    
//     try {
//       console.log('⏸️ Pausing stream:', streamId);
//       const xdr = await salaryStreamingMethods.pauseStream(streamId, publicKey);
      
//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
//         alert(`Stream ${streamId} paused successfully`);
        
//         // Refresh streams
//         await loadStreams();
//       }
//     } catch (error) {
//       console.error('Failed to pause stream:', error);
//       alert('Failed to pause stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
//     }
//   };

//   const resumeStream = async (streamId: number) => {
//     if (testMode) {
//       alert('🧪 Test modunda stream yönetimi mevcut değil');
//       return;
//     }
    
//     try {
//       console.log('▶️ Resuming stream:', streamId);
//       const xdr = await salaryStreamingMethods.resumeStream(streamId, publicKey);
      
//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
//         alert(`Stream ${streamId} resumed successfully`);
        
//         // Refresh streams
//         await loadStreams();
//       }
//     } catch (error) {
//       console.error('Failed to resume stream:', error);
//       alert('Failed to resume stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
//     }
//   };

//   const endStream = async (streamId: number) => {
//     if (testMode) {
//       alert('🧪 Test modunda stream yönetimi mevcut değil');
//       return;
//     }
    
//     if (!confirm(`Are you sure you want to end stream ${streamId}? This action cannot be undone.`)) {
//       return;
//     }
    
//     try {
//       console.log('🔒 Ending stream:', streamId);
//       const xdr = await salaryStreamingMethods.endStream(streamId, publicKey);
      
//       if (xdr) {
//         await signAndSubmitTransaction(xdr);
//         alert(`Stream ${streamId} ended successfully`);
        
//         // Refresh streams
//         await loadStreams();
//       }
//     } catch (error) {
//       console.error('Failed to end stream:', error);
//       alert('Failed to end stream: ' + (error instanceof Error ? error.message : 'Unknown error'));
//     }
//   };

//   const getAvailableAmount = (stream: Stream): number => {
//     const now = Math.floor(Date.now() / 1000); // Convert to Unix timestamp (seconds)
//     const elapsed = Math.max(0, now - stream.startTime); // Both in seconds now
//     const earned = Math.min(elapsed * stream.ratePerSecond, stream.totalAmount);
//     return Math.max(0, (earned - stream.withdrawnAmount) / 10000000); // Convert stroops to XLM
//   };

//   const formatTime = (seconds: number): string => {
//     const days = Math.floor(seconds / 86400);
//     const hours = Math.floor((seconds % 86400) / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
    
//     if (days > 0) return `${days}d ${hours}h`;
//     if (hours > 0) return `${hours}h ${mins}m`;
//     return `${mins}m`;
//   };

//   // CLI benzeri withdraw test fonksiyonu
//   const testWithdrawCLI = async () => {
//     try {
//       console.log('🧪 Testing CLI-like withdraw...');
      
//       // CLI parametreleri:
//       // --stream_id 1 --amount 73535
//       const streamId = 1;
//       const amount = 73535; // stroops
      
//       console.log('📋 Parameters:');
//       console.log('  Stream ID:', streamId);
//       console.log('  Amount (stroops):', amount);
//       console.log('  Amount (XLM):', amount / 10000000);
//       console.log('  Employee (current user):', publicKey);
      
//       const xdr = await salaryStreamingMethods.withdraw(
//         streamId,
//         amount,
//         publicKey // Employee authorization
//       );
      
//       console.log('✅ XDR generated, signing with Freighter...');
      
//       const result = await signAndSubmitTransaction(xdr);
//       console.log('🎉 CLI-like withdraw successful:', result);
      
//       alert(`Withdraw successful! Amount: ${amount / 10000000} XLM`);
      
//       // Refresh streams
//       await loadStreams();
      
//     } catch (error) {
//       console.error('❌ CLI-like withdraw failed:', error);
//       alert('Withdraw failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
//     }
//   };

//   // Test withdraw function - blockchain'e bağlı değil
//   const testWithdrawLocal = async (streamId: number, amount: number) => {
//     try {
//       console.log('🧪 LOCAL TEST - Withdraw simulation');
//       console.log('📋 Stream ID:', streamId);
//       console.log('💰 Amount (stroops):', amount);
//       console.log('💰 Amount (XLM):', amount / 10000000);
      
//       const stream = testStreams.find(s => s.id === streamId);
//       if (!stream) {
//         throw new Error('Stream not found');
//       }
      
//       // Employee check
//       if (stream.employee !== publicKey) {
//         throw new Error('Only employee can withdraw from this stream');
//       }
      
//       // Available balance check
//       const available = getAvailableAmount(stream);
//       const requestedXLM = amount / 10000000;
      
//       console.log('📊 Available balance:', available, 'XLM');
//       console.log('📊 Requested amount:', requestedXLM, 'XLM');
      
//       if (requestedXLM > available) {
//         throw new Error(`Insufficient balance. Available: ${available.toFixed(7)} XLM`);
//       }
      
//       // Simulate successful withdraw
//       console.log('✅ LOCAL TEST - Withdraw would be successful!');
//       console.log('🎉 This transaction would work on blockchain');
      
//       alert(`✅ LOCAL TEST SUCCESS!\n\nStream ID: ${streamId}\nAmount: ${requestedXLM} XLM\nAvailable: ${available.toFixed(7)} XLM\n\nThis would work on real blockchain!`);
      
//       return { status: 'SUCCESS', amount: requestedXLM };
      
//     } catch (error) {
//       console.error('❌ LOCAL TEST - Error:', error);
//       alert('❌ LOCAL TEST FAILED: ' + (error instanceof Error ? error.message : 'Unknown error'));
//       throw error;
//     }
//   };

//   // Test withdraw CLI benzeri - lokal test
//   const testWithdrawCLILocal = async () => {
//     try {
//       await testWithdrawLocal(1, 100); // CLI benzeri parametreler
//     } catch (error) {
//       console.error('CLI-like test failed:', error);
//     }
//   };

//   // Test stream verilerini göster (debug için)
//   const showTestStreamData = () => {
//     console.log('🧪 Test Stream Data:');
//     testStreams.forEach(stream => {
//       const available = getAvailableAmount({
//         ...stream,
//         totalAmount: stream.totalAmount / 10000000,
//         withdrawnAmount: stream.withdrawnAmount / 10000000
//       });
//       console.log(`Stream ${stream.id}:`);
//       console.log(`  Employer: ${stream.employer}`);
//       console.log(`  Employee: ${stream.employee}`);
//       console.log(`  Total: ${stream.totalAmount / 10000000} XLM`);
//       console.log(`  Rate: ${stream.ratePerSecond} stroops/sec`);
//       console.log(`  Withdrawn: ${stream.withdrawnAmount / 10000000} XLM`);
//       console.log(`  Available: ${available.toFixed(7)} XLM`);
//       console.log(`  Can withdraw: ${stream.employee === publicKey ? 'YES' : 'NO'}`);
//       console.log('---');
//     });
//   };

//   // Stream kategorileri
//   const activeStreams = streams.filter(s => s.isActive && !s.isPaused);
//   const pausedStreams = streams.filter(s => s.isActive && s.isPaused);
//   const inactiveStreams = streams.filter(s => !s.isActive);

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
                  
//                   {/* CLI Test Withdraw Button */}
//                   {devMode && (
//                     <button
//                       onClick={testWithdrawCLI}
//                       className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
//                       title="Test CLI-like withdraw (Stream 1, 73535 stroops)"
//                     >
//                       CLI Test
//                     </button>
//                   )}
                  
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
              
//               {/* Test Mode Toggle */}
//               <div className="flex justify-between items-center border-t pt-2">
//                 <span className="font-medium">Test Mode:</span>
//                 <div className="flex items-center space-x-2">
//                   <button
//                     onClick={() => setTestMode(!testMode)}
//                     className={`px-2 py-1 text-xs rounded ${
//                       testMode 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-red-100 text-red-800'
//                     }`}
//                   >
//                     {testMode ? '🧪 TEST' : '🌐 REAL'}
//                   </button>
//                   {testMode && (
//                     <button
//                       onClick={showTestStreamData}
//                       className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
//                       title="Show test data in console"
//                     >
//                       Debug
//                     </button>
//                   )}
//                   {!testMode && (
//                     <button
//                       onClick={testContractRead}
//                       className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
//                       title="Test contract read"
//                     >
//                       Test Read
//                     </button>
//                   )}
//                   <span className="text-xs text-gray-500">
//                     {testMode ? 'Blockchain\'e bağlı değil' : 'Gerçek blockchain'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Streams Overview */}
//         {streams.length > 0 && (
//           <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//               <div className="flex items-center">
//                 <div className="bg-green-100 p-2 rounded-lg">
//                   <DollarSign className="w-6 h-6 text-green-600" />
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-green-600">Active Streams</p>
//                   <p className="text-2xl font-semibold text-green-900">{activeStreams.length}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
//               <div className="flex items-center">
//                 <div className="bg-yellow-100 p-2 rounded-lg">
//                   <Clock className="w-6 h-6 text-yellow-600" />
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-yellow-600">Paused Streams</p>
//                   <p className="text-2xl font-semibold text-yellow-900">{pausedStreams.length}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-red-50 p-4 rounded-lg border border-red-200">
//               <div className="flex items-center">
//                 <div className="bg-red-100 p-2 rounded-lg">
//                   <StopCircle className="w-6 h-6 text-red-600" />
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-red-600">Inactive Streams</p>
//                   <p className="text-2xl font-semibold text-red-900">{inactiveStreams.length}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//               <div className="flex items-center">
//                 <div className="bg-blue-100 p-2 rounded-lg">
//                   <TrendingUp className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm font-medium text-blue-600">Total Available</p>
//                   <p className="text-2xl font-semibold text-blue-900">
//                     {activeStreams.reduce((sum, s) => sum + getAvailableAmount(s), 0).toFixed(2)} XLM
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Create New Stream */}
//         <div className="mb-8 p-4 bg-gray-50 rounded-lg">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold">Create New Stream</h3>
//             {testMode && (
//               <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg">
//                 🧪 Test Mode: Stream oluşturma devre dışı
//               </div>
//             )}
//           </div>
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
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-green-700">✅ Active Streams</h3>
//             <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm">
//               {activeStreams.length} active
//             </span>
//           </div>
//           {activeStreams.length === 0 ? (
//             <p className="text-gray-500">No active streams</p>
//           ) : (
//             activeStreams.map((stream) => {
//               const available = getAvailableAmount(stream);
//               const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

//               return (
//                 <div key={stream.id} className="border rounded-lg p-4 bg-white">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <div className="flex items-center gap-2 mb-2">
//                         <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
//                         <div className="flex gap-1">
//                           {stream.isActive ? (
//                             <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
//                               ✅ Active
//                             </span>
//                           ) : (
//                             <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
//                               ❌ Inactive
//                             </span>
//                           )}
//                           {stream.isPaused && (
//                             <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
//                               ⏸️ Paused
//                             </span>
//                           )}
//                         </div>
//                       </div>
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
                        
//                         {/* Stream Management - Only for Employer */}
//                         {stream.employer === publicKey && !testMode && (
//                           <div className="flex gap-2 mt-2">
//                             <button
//                               onClick={() => pauseStream(stream.id)}
//                               className="flex-1 bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700"
//                             >
//                               ⏸️ Pause
//                             </button>
//                             <button
//                               onClick={() => endStream(stream.id)}
//                               className="flex-1 bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
//                             >
//                               🔒 End
//                             </button>
//                           </div>
//                         )}
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

//         {/* Paused Streams */}
//         {pausedStreams.length > 0 && (
//           <div className="space-y-4 mt-8">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold text-yellow-700">⏸️ Paused Streams</h3>
//               <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-sm">
//                 {pausedStreams.length} paused
//               </span>
//             </div>
//             {pausedStreams.map((stream) => {
//               const available = getAvailableAmount(stream);
//               const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

//               return (
//                 <div key={stream.id} className="border rounded-lg p-4 bg-yellow-50">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <div className="flex items-center gap-2 mb-2">
//                         <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
//                         <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
//                           ⏸️ Paused
//                         </span>
//                       </div>
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
//                             className="bg-yellow-600 h-2 rounded-full" 
//                             style={{ width: `${Math.min(progress, 100)}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <p className="text-sm font-medium text-yellow-600">
//                         Available: {available.toFixed(7)} XLM (Paused)
//                       </p>
                      
//                       <div className="mt-3">
//                         <p className="text-sm text-yellow-700">
//                           ⚠️ Stream is paused. Resume to continue earning.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Inactive Streams */}
//         {inactiveStreams.length > 0 && (
//           <div className="space-y-4 mt-8">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold text-red-700">❌ Inactive Streams</h3>
//               <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-sm">
//                 {inactiveStreams.length} inactive
//               </span>
//             </div>
//             {inactiveStreams.map((stream) => {
//               const available = getAvailableAmount(stream);
//               const progress = (stream.withdrawnAmount / stream.totalAmount) * 100;

//               return (
//                 <div key={stream.id} className="border rounded-lg p-4 bg-red-50">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <div className="flex items-center gap-2 mb-2">
//                         <h4 className="font-semibold text-gray-900">Stream #{stream.id}</h4>
//                         <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
//                           ❌ Inactive
//                         </span>
//                       </div>
//                       <p className="text-sm text-gray-600">Employee: {stream.employee}</p>
//                       <p className="text-sm text-gray-600">Total: {stream.totalAmount} XLM</p>
//                       <p className="text-sm text-gray-600">Rate: {stream.ratePerSecond.toFixed(7)} XLM/sec</p>
//                     </div>
                    
//                     <div>
//                       <div className="mb-2">
//                         <div className="flex justify-between text-sm">
//                           <span>Final Progress</span>
//                           <span>{progress.toFixed(1)}%</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <div 
//                             className="bg-red-600 h-2 rounded-full" 
//                             style={{ width: `${Math.min(progress, 100)}%` }}
//                           ></div>
//                         </div>
//                       </div>
                      
//                       <p className="text-sm font-medium text-red-600">
//                         Final Amount: {stream.withdrawnAmount.toFixed(7)} XLM
//                       </p>
                      
//                       <div className="mt-3">
//                         <p className="text-sm text-red-700">
//                           🔒 Stream has ended. No more earnings available.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
