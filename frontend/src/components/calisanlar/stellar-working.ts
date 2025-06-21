// import { rpc, Contract, TransactionBuilder, Account, xdr, scValToNative, nativeToScVal, Address, StrKey, Operation } from '@stellar/stellar-sdk';
// import { signTransaction } from '@stellar/freighter-api';
// import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contracts';

// // Initialize Soroban server (only on client side)
// export const getServer = () => {
//   if (typeof window === 'undefined') return null;
//   return new rpc.Server(NETWORK_CONFIG.rpcUrl);
// };

// // Create contract instances  
// export const createContract = (contractAddress: string) => {
//   return new Contract(contractAddress);
// };

// // Helper function to build contract transactions
// export const buildContractTransaction = async (
//   contractAddress: string,
//   method: string,
//   args: any[] = [],
//   publicKey: string
// ) => {
//   try {
//     console.log('🔧 Building contract transaction:');
//     console.log('  📋 Contract:', contractAddress);
//     console.log('  🎯 Method:', method);
//     console.log('  👤 Public Key:', publicKey, typeof publicKey);
//     console.log('  📝 Args:', args);
    
//     // Validate publicKey format
//     if (typeof publicKey !== 'string') {
//       throw new Error(`Invalid publicKey type: expected string, got ${typeof publicKey}`);
//     }
    
//     if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
//       throw new Error(`Invalid publicKey format: ${publicKey}`);
//     }
    
//     const server = getServer();
//     if (!server) throw new Error('Server not available on server side');
    
//     const contract = createContract(contractAddress);
//     const account = await server.getAccount(publicKey);
    
//     // Convert arguments to ScVal format with method-specific typing
//     const scArgs = args.map((arg, index) => {
//       console.log(`Converting arg ${index}:`, arg, typeof arg);
      
//       if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
//         console.log(`  → Address: ${arg}`);
//         // Always use nativeToScVal for consistency with working CLI
//         const addressScVal = nativeToScVal(arg, { type: 'address' });
//         console.log(`  → Address ScVal created successfully for: ${arg}`);
//         console.log(`  → ScVal type:`, addressScVal.switch().name);
//         return addressScVal;
//       }
      
//       if (typeof arg === 'number') {
//         if (method === 'create_stream') {
//           if (index === 2) { // total_amount -> i128
//             console.log(`  → i128: ${arg}`);
//             return nativeToScVal(arg, { type: 'i128' });
//           }
//           if (index === 3) { // duration_seconds -> u64
//             console.log(`  → u64: ${arg}`);
//             return nativeToScVal(arg, { type: 'u64' });
//           }
//         }
        
//         if (method === 'withdraw') {
//           if (index === 1) { // amount -> i128
//             console.log(`  → i128: ${arg}`);
//             return nativeToScVal(arg, { type: 'i128' });
//           }
//         }
        
//         // Default number handling
//         console.log(`  → Default u64: ${arg}`);
//         return nativeToScVal(arg, { type: 'u64' });
//       }
      
//       console.log(`  → Default: ${arg}`);
//       return nativeToScVal(arg);
//     });

//     console.log('\n🏗️ Building Soroban transaction...');
//     console.log('🔧 Using contract.call() for proper Soroban formatting');
    
//     const transaction = new TransactionBuilder(account, {
//       fee: '1000000', // Much higher fee for Soroban contract calls (1 XLM)
//       networkPassphrase: NETWORK_CONFIG.networkPassphrase,
//     })
//       .addOperation(contract.call(method, ...scArgs))
//       .setTimeout(300) // 5 minutes
//       .build();

//     console.log('🧪 Simulating transaction for accurate resource estimation...');
//     const simulation = await server.simulateTransaction(transaction);
    
//     if (rpc.Api.isSimulationError(simulation)) {
//       console.error('❌ Transaction simulation failed:', simulation);
//       throw new Error(`Transaction simulation failed: ${simulation.error}`);
//     }
    
//     console.log('✅ Transaction simulation successful');
//     console.log('📊 Simulation result:', simulation.result);
    
//     // Build the final transaction with proper resource footprint
//     const preparedTransaction = await server.prepareTransaction(transaction);

//     console.log('🎯 Transaction prepared with Soroban resource footprint');
//     console.log('💰 Final fee:', preparedTransaction.fee);
//     console.log('📊 Prepared transaction operations:', preparedTransaction.operations.length);
//     console.log('📊 First operation type:', preparedTransaction.operations[0].type);
//     console.log('📊 Transaction source account:', preparedTransaction.source);
//     console.log('📊 Network passphrase:', NETWORK_CONFIG.networkPassphrase);

//     return preparedTransaction.toXDR();
//   } catch (error) {
//     console.error('Build transaction error:', error);
//     throw error;
//   }
// };

// // Helper function to read from contract (no transaction needed)
// export const readContract = async (
//   contractAddress: string,
//   method: string,
//   args: any[] = []
// ) => {
//   try {
//     const server = getServer();
//     if (!server) throw new Error('Server not available on server side');
    
//     const contract = createContract(contractAddress);
    
//     // Convert arguments to ScVal format
//     const scArgs = args.map(arg => {
//       if (typeof arg === 'string') return nativeToScVal(arg, { type: 'address' });
//       if (typeof arg === 'number') return nativeToScVal(arg, { type: 'u64' });
//       return nativeToScVal(arg);
//     });

//     // For read operations, we can simulate the call with a dummy account
//     const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
    
//     const transaction = new TransactionBuilder(dummyAccount, {
//       fee: '10000',
//       networkPassphrase: NETWORK_CONFIG.networkPassphrase,
//     })
//       .addOperation(contract.call(method, ...scArgs))
//       .setTimeout(300)
//       .build();

//     const response = await server.simulateTransaction(transaction);
    
//     if (rpc.Api.isSimulationSuccess(response)) {
//       return scValToNative(response.result!.retval);
//     } else {
//       console.error('Contract simulation failed:', response);
//       throw new Error('Contract simulation failed');
//     }
//   } catch (error) {
//     console.error('Read contract error:', error);
//     throw error;
//   }
// };

// // Sign and submit transaction using Freighter
// export const signAndSubmitTransaction = async (xdr: string) => {
//   try {
//     console.log('🔏 [STEP 1] Starting transaction signing process...');
//     console.log('📋 XDR to sign (first 100 chars):', xdr.substring(0, 100) + '...');
    
//     const server = getServer();
//     if (!server) {
//       console.error('❌ Server not available on client side');
//       throw new Error('Server not available on client side');
//     }
//     console.log('✅ [STEP 1] Server initialized');
    
//     if (typeof window === 'undefined') {
//       console.error('❌ Window not available');
//       throw new Error('Freighter wallet not available on server side');
//     }
//     console.log('✅ [STEP 1] Window available');

//     console.log('🌐 Network passphrase:', NETWORK_CONFIG.networkPassphrase);
//     console.log('🌐 RPC URL:', NETWORK_CONFIG.rpcUrl);
//     console.log('🌐 Environment:', NETWORK_CONFIG.environment);
    
//     // Sign the transaction with Freighter
//     console.log('✍️ [STEP 2] Requesting signature from Freighter...');
//     console.log('📋 About to call signTransaction with XDR length:', xdr.length);
//     console.log('🌐 Network for signing:', NETWORK_CONFIG.networkPassphrase);
//     console.log('🚨 ÖNEMLI: Freighter\'da "Invoke Host Function" seçeneğini görmelisiniz!');
    
//     let signedResult;
//     try {
//       signedResult = await signTransaction(xdr, { 
//         networkPassphrase: NETWORK_CONFIG.networkPassphrase
//       });
//       console.log('✅ [STEP 2] signTransaction call completed');
//     } catch (signError) {
//       console.error('❌ [STEP 2] signTransaction failed:', signError);
//       console.error('❌ [STEP 2] Error type:', typeof signError);
//       console.error('❌ [STEP 2] Error message:', signError instanceof Error ? signError.message : String(signError));
//       throw signError;
//     }
    
//     console.log('✅ [STEP 2] Transaction signed successfully');
//     console.log('📋 Signed XDR length:', signedResult.signedTxXdr.length);
//     console.log('📋 Signed XDR (first 100 chars):', signedResult.signedTxXdr.substring(0, 100) + '...');
    
//     // Parse the signed transaction
//     console.log('🔄 [STEP 3] Parsing signed transaction...');
//     const transaction = TransactionBuilder.fromXDR(signedResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
//     console.log('✅ [STEP 3] Transaction parsed successfully');
    
//     console.log('📤 [STEP 4] Submitting transaction to network...');
//     console.log('🌐 RPC URL:', NETWORK_CONFIG.rpcUrl);
    
//     const result = await server.sendTransaction(transaction);
    
//     console.log('🎉 [STEP 4] Transaction submitted!');
//     console.log('📊 Full result object:', result);
//     console.log('🔗 Transaction status:', result.status);
//     console.log('🆔 Transaction hash:', result.hash);
    
//     // For Soroban transactions, check the actual result
//     if (result.status === 'PENDING') {
//       console.log('⏳ [STEP 5] Transaction is pending, waiting for confirmation...');
      
//       // Wait a bit and then check the result
//       await new Promise(resolve => setTimeout(resolve, 3000));
      
//       try {
//         console.log('🔍 [STEP 5] Checking final transaction result...');
//         const finalResult = await server.getTransaction(result.hash);
//         console.log('✅ [STEP 5] Final transaction result:', finalResult);
        
//         return {
//           status: finalResult.status,
//           hash: result.hash,
//           result: finalResult
//         };
//       } catch (e) {
//         console.log('⚠️ [STEP 5] Could not get final result, but transaction was submitted');
//         console.log('⚠️ Error getting final result:', e);
//         return {
//           status: 'PENDING',
//           hash: result.hash,
//           result: result
//         };
//       }
//     }
    
//     console.log('✅ [FINAL] Transaction completed with status:', result.status);
//     return {
//       status: result.status,
//       hash: result.hash,
//       result: result
//     };
//   } catch (error) {
//     console.error('❌ [ERROR] Transaction signing/submission error:', error);
//     console.error('❌ [ERROR] Error type:', typeof error);
//     console.error('❌ [ERROR] Error message:', error instanceof Error ? error.message : String(error));
//     console.error('❌ [ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
//     // Provide more specific error messages
//     if (error instanceof Error) {
//       if (error.message.includes('User declined') || error.message.includes('User rejected')) {
//         throw new Error('Transaction cancelled by user');
//       }
//       if (error.message.includes('Invalid signature')) {
//         throw new Error('Invalid transaction signature');
//       }
//       if (error.message.includes('network')) {
//         throw new Error('Network error - please check your connection');
//       }
//     }
    
//     throw error;
//   }
// };

// // Helper functions for specific contracts
// export const salaryStreamingMethods = {
//   createStream: (employer: string, employee: string, totalAmount: number, durationSeconds: number) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'create_stream', [employer, employee, totalAmount, durationSeconds], employer),
  
//   withdraw: (streamId: number, amount: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'withdraw', [streamId, amount], publicKey),
  
//   getAvailableBalance: (streamId: number) =>
//     readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'calculate_available', [streamId]),
  
//   pauseStream: (streamId: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'pause_stream', [streamId], publicKey),
  
//   resumeStream: (streamId: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'resume_stream', [streamId], publicKey),
  
//   endStream: (streamId: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'end_stream', [streamId], publicKey),
  
//   getEmployeeStreams: (employee: string) =>
//     readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'get_employee_streams', [employee]),
// };

// export const lendingMethods = {
//   requestLoan: (amount: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.LENDING, 'request_loan', [amount], publicKey),
  
//   getOutstandingLoans: (borrower: string) =>
//     readContract(CONTRACT_ADDRESSES.LENDING, 'get_outstanding_loans', [borrower]),
  
//   repayLoan: (loanId: number, amount: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.LENDING, 'repay_loan', [loanId, amount], publicKey),
  
//   calculateMaxLoan: (streamId: number) =>
//     readContract(CONTRACT_ADDRESSES.LENDING, 'calculate_max_loan', [streamId]),
  
//   getLoanDetails: (loanId: number) =>
//     readContract(CONTRACT_ADDRESSES.LENDING, 'get_loan_details', [loanId]),
// };

// export const workProfileMethods = {
//   addWorkExperience: (title: string, company: string, startDate: number, endDate: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.WORK_PROFILE, 'add_work_experience', [title, company, startDate, endDate], publicKey),
  
//   getWorkProfile: (profileOwner: string) =>
//     readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'get_work_profile', [profileOwner]),
// };
