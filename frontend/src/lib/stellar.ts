import { rpc, Contract, TransactionBuilder, Account, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contracts';

// Initialize Soroban server (only on client side)
export const getServer = () => {
  if (typeof window === 'undefined') return null;
  return new rpc.Server(NETWORK_CONFIG.rpcUrl);
};

// Create contract instances  
export const createContract = (contractAddress: string) => {
  return new Contract(contractAddress);
};

// Helper function to build contract transactions - Simplified approach
export const buildContractTransaction = async (
  contractAddress: string,
  method: string,
  args: unknown[] = [],
  publicKey: string
) => {
  try {
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    const account = await server.getAccount(publicKey);
    
    console.log('🔧 Building contract transaction (simplified):');
    console.log('  📋 Contract:', contractAddress);
    console.log('  🎯 Method:', method);
    console.log('  👤 Public Key:', publicKey);
    console.log('  📝 Raw Args:', args);
    
    // Use basic contract approach without complex type conversions
    const contract = new Contract(contractAddress);
    
    // Proper type handling for SDK v13
    console.log('🎯 Creating contract call with explicit ScVal conversion...');
    
    const convertedArgs = args.map((arg, index) => {
      console.log(`Converting arg ${index}:`, arg, typeof arg);
      
      if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
        console.log(`  → Address (ScVal): ${arg}`);
        // Convert string address to ScVal address
        return nativeToScVal(arg, { type: 'address' });
      }
      
      if (typeof arg === 'number') {
        console.log(`  → Number (ScVal): ${arg}`);
        // For create_stream method, we need specific types
        if (method === 'create_stream') {
          if (index === 2) { // total_amount -> i128
            console.log(`    → Converting to i128: ${arg}`);
            return nativeToScVal(BigInt(arg), { type: 'i128' });
          }
          if (index === 3) { // duration_seconds -> u64
            console.log(`    → Converting to u64: ${arg}`);
            return nativeToScVal(BigInt(arg), { type: 'u64' });
          }
        }
        // Default for other numbers
        return nativeToScVal(BigInt(arg), { type: 'u64' });
      }
      
      console.log(`  → Raw value (native): ${arg}`);
      return nativeToScVal(arg);
    });
    
    console.log('✅ All args converted to ScVal:', convertedArgs);
    
    const operation = contract.call(method, ...convertedArgs);
    
    console.log('✅ Contract operation created');

    const transaction = new TransactionBuilder(account, {
      fee: '10000000', // Super high fee (10 XLM) to ensure acceptance
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    console.log('✅ Transaction built');
    console.log('� Transaction XDR:', transaction.toXDR());

    return transaction.toXDR();
    
  } catch (error) {
    console.error('❌ Build transaction error:', error);
    throw error;
  }
};

// Helper function to read from contract (no transaction needed)
export const readContract = async (
  contractAddress: string,
  method: string,
  args: unknown[] = []
) => {
  try {
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    const contract = createContract(contractAddress);
    
    // Convert arguments to ScVal format
    const scArgs = args.map(arg => {
      if (typeof arg === 'string') {
        if (arg.length === 56 && arg.startsWith('G')) {
          return nativeToScVal(arg, { type: 'address' });
        }
        return nativeToScVal(arg, { type: 'string' });
      }
      if (typeof arg === 'number') return nativeToScVal(arg, { type: 'u32' });
      return nativeToScVal(arg);
    });

    // For read operations, we can simulate the call with a dummy account
    const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
    
    const transaction = new TransactionBuilder(dummyAccount, {
      fee: '10000',
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(300)
      .build();

    const response = await server.simulateTransaction(transaction);
    
    if (rpc.Api.isSimulationSuccess(response)) {
      return scValToNative(response.result!.retval);
    } else {
      throw new Error('Simulation failed');
    }
  } catch (error) {
    console.error('Read contract error:', error);
    throw error;
  }
};

// Sign and submit transaction using Freighter
export const signAndSubmitTransaction = async (xdr: string) => {
  try {
    console.log('🔄 Signing transaction XDR:', xdr);
    
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    if (typeof window === 'undefined') {
      throw new Error('Freighter wallet not available on server side');
    }

    const { signedTxXdr } = await signTransaction(xdr, { networkPassphrase: NETWORK_CONFIG.networkPassphrase });
    const transaction = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    
    console.log('📤 Submitting transaction to network...');
    const result = await server.sendTransaction(transaction);
    
    console.log('📊 Full Transaction Result:', result);
    
    // Check if transaction was successful
    if (result.status === 'PENDING') {
      console.log('🎉 Transaction submitted successfully (PENDING)!');
      console.log('📋 Transaction Hash:', result.hash);
      console.log('🔗 Explorer Link:', `https://stellar.expert/explorer/testnet/tx/${result.hash}`);
      
      return result;
    } else {
      // Transaction failed - log and throw user-friendly error
      throw new Error(`Transaction failed with status: ${result.status}. Please check your account balance and try again.`);
    }
  } catch (error) {
    console.error('❌ Transaction error:', error);
    
    // Enhanced error reporting
    if (error instanceof Error) {
      if (error.message.includes('insufficient balance')) {
        throw new Error('Insufficient XLM balance. Please fund your account.');
      }
      if (error.message.includes('authorization')) {
        throw new Error('Authorization failed. Please ensure you are using the correct account.');
      }
    }
    
    throw error;
  }
};

// Helper functions for specific contracts
export const salaryStreamingMethods = {
  createStream: (employer: string, employee: string, total_amount: number,duration_seconds: number) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'create_stream', [employer, employee, total_amount, duration_seconds], employer),
  
  withdraw: (streamId: number, amount: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'withdraw', [streamId, amount], publicKey),
  
  getAvailableBalance: (streamId: number) =>
    readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'calculate_available', [streamId]),
  
  pauseStream: (streamId: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'pause_stream', [streamId], publicKey),
  
  resumeStream: (streamId: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'resume_stream', [streamId], publicKey),
  
  endStream: (streamId: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'end_stream', [streamId], publicKey),
  
  getEmployeeStreams: (employee: string) =>
    readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'get_employee_streams', [employee]),
};

export const lendingMethods = {
  requestLoan: (amount: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.LENDING, 'request_loan', [amount], publicKey),
  
  getOutstandingLoans: (borrower: string) =>
    readContract(CONTRACT_ADDRESSES.LENDING, 'get_outstanding_loans', [borrower]),
  
  repayLoan: (loanId: number, amount: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.LENDING, 'repay_loan', [loanId, amount], publicKey),
  
  calculateMaxLoan: (streamId: number) =>
    readContract(CONTRACT_ADDRESSES.LENDING, 'calculate_max_loan', [streamId]),
  
  getLoanDetails: (loanId: number) =>
    readContract(CONTRACT_ADDRESSES.LENDING, 'get_loan_details', [loanId]),
};

export const workProfileMethods = {
  updateProfile: (experience: number, jobDuration: number, jobChanges: number, sector: string, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.WORK_PROFILE, 'update_profile', [experience, jobDuration, jobChanges, sector], publicKey),
  
  getRiskScore: (employee: string) =>
    readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'calculate_risk_score', [employee]),
  
  getRiskTier: (employee: string) =>
    readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'get_risk_tier', [employee]),
};

// import { rpc, Contract, TransactionBuilder, Account, xdr, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';
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
//     const server = getServer();
//     if (!server) throw new Error('Server not available on server side');
    
//     const contract = createContract(contractAddress);
//     const account = await server.getAccount(publicKey);
    
//     // Convert arguments to ScVal format
//     const scArgs = args.map(arg => {
//       if (typeof arg === 'string') return nativeToScVal(arg, { type: 'address' });
//       if (typeof arg === 'number') return nativeToScVal(arg, { type: 'u64' });
//       return nativeToScVal(arg);
//     });

//     const transaction = new TransactionBuilder(account, {
//       fee: '10000', // Increased fee for Soroban
//       networkPassphrase: NETWORK_CONFIG.networkPassphrase,
//     })
//       .addOperation(contract.call(method, ...scArgs))
//       .setTimeout(300) // 5 minutes
//       .build();

//     return transaction.toXDR();
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
//       throw new Error('Simulation failed');
//     }
//   } catch (error) {
//     console.error('Read contract error:', error);
//     throw error;
//   }
// };

// // Sign and submit transaction using Freighter
// export const signAndSubmitTransaction = async (xdr: string) => {
//   try {
//     const server = getServer();
//     if (!server) throw new Error('Server not available on server side');
    
//     if (typeof window === 'undefined') {
//       throw new Error('Freighter wallet not available on server side');
//     }

//     const { signedTxXdr } = await signTransaction(xdr, { networkPassphrase: NETWORK_CONFIG.networkPassphrase });
//     const transaction = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    
//     const result = await server.sendTransaction(transaction);
//     console.log('Transaction result:', result);
    
//     return result;
//   } catch (error) {
//     console.error('Transaction error:', error);
//     throw error;
//   }
// };

// // Helper functions for specific contracts
// export const salaryStreamingMethods = {
//   createStream: (employee: string, amount: number, duration: number, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'create_stream', [employee, amount, duration], publicKey),
  
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
//   updateProfile: (experience: number, jobDuration: number, jobChanges: number, sector: string, publicKey: string) =>
//     buildContractTransaction(CONTRACT_ADDRESSES.WORK_PROFILE, 'update_profile', [experience, jobDuration, jobChanges, sector], publicKey),
  
//   getRiskScore: (employee: string) =>
//     readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'calculate_risk_score', [employee]),
  
//   getRiskTier: (employee: string) =>
//     readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'get_risk_tier', [employee]),
// };
