import { rpc, Contract, TransactionBuilder, Account, xdr, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';
import { signTransaction, getAddress } from '@stellar/freighter-api';
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

// Helper function to build contract transactions
export const buildContractTransaction = async (
  contractAddress: string,
  method: string,
  args: any[] = [],
  publicKey: string
) => {
  try {
    console.log('🔧 Building contract transaction:');
    console.log('  📋 Contract:', contractAddress);
    console.log('  🎯 Method:', method);
    console.log('  👤 Public Key:', publicKey, typeof publicKey);
    console.log('  📝 Args:', args);
    
    // Validate publicKey format
    if (typeof publicKey !== 'string') {
      throw new Error(`Invalid publicKey type: expected string, got ${typeof publicKey}`);
    }
    
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
      throw new Error(`Invalid publicKey format: ${publicKey}`);
    }
    
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    const contract = createContract(contractAddress);
    const account = await server.getAccount(publicKey);
    
    // Convert arguments to ScVal format with method-specific typing
    console.log('🔧 Converting arguments for method:', method);
    const scArgs = args.map((arg, index) => {
      console.log(`Converting arg[${index}]:`, arg, typeof arg);
      
      if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
        console.log(`  → Address[${index}]: ${arg}`);
        return nativeToScVal(arg, { type: 'address' });
      }
      
      if (typeof arg === 'number') {
        if (method === 'create_stream') {
          if (index === 0) {
            console.log(`  → arg[${index}] should be EMPLOYER address but got number: ${arg}`);
          }
          if (index === 1) {
            console.log(`  → arg[${index}] should be EMPLOYEE address but got number: ${arg}`);
          }
          if (index === 2) { // total_amount -> i128
            console.log(`  → i128[${index}] total_amount: ${arg}`);
            return nativeToScVal(arg, { type: 'i128' });
          }
          if (index === 3) { // duration_seconds -> u64
            console.log(`  → u64[${index}] duration_seconds: ${arg}`);
            return nativeToScVal(arg, { type: 'u64' });
          }
        }
        
        if (method === 'withdraw') {
          if (index === 1) { // amount -> i128
            console.log(`  → i128: ${arg}`);
            return nativeToScVal(arg, { type: 'i128' });
          }
        }
        
        // Default number handling
        console.log(`  → Default u64: ${arg}`);
        return nativeToScVal(arg, { type: 'u64' });
      }
        console.log(`  → Default u64: ${arg}`);
        return nativeToScVal(arg, { type: 'u64' });
      }
      
      console.log(`  → Default: ${arg}`);
      return nativeToScVal(arg);
    });

    const transaction = new TransactionBuilder(account, {
      fee: '1000000', // Much higher fee for Soroban contract calls
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(300) // 5 minutes
      .build();

    return transaction.toXDR();
  } catch (error) {
    console.error('Build transaction error:', error);
    throw error;
  }
};

// Helper function to read from contract (no transaction needed)
export const readContract = async (
  contractAddress: string,
  method: string,
  args: any[] = []
) => {
  try {
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    const contract = createContract(contractAddress);
    
    // Convert arguments to ScVal format with CLI-compatible encoding
    const scArgs = args.map((arg, index) => {
      console.log(`Converting arg ${index}:`, arg, typeof arg);
      
      // Address parameter (employer, employee)
      if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
        console.log(`  → Address: ${arg}`);
        return nativeToScVal(arg, { type: 'address' });
      }
      
      // Amount parameter (total_amount) - should be i128
      if (typeof arg === 'number' && method === 'create_stream') {
        if (index === 2) { // total_amount position
          console.log(`  → total_amount (i128): ${arg}`);
          return nativeToScVal(arg, { type: 'i128' });
        }
        if (index === 3) { // duration_seconds position
          console.log(`  → duration_seconds (u64): ${arg}`);
          return nativeToScVal(arg, { type: 'u64' });
        }
      }
      
      // Withdraw method handling
      if (typeof arg === 'number' && method === 'withdraw') {
        if (index === 1) { // amount position
          console.log(`  → withdraw amount (i128): ${arg}`);
          return nativeToScVal(arg, { type: 'i128' });
        }
        if (index === 0) { // streamId position
          console.log(`  → streamId (u64): ${arg}`);
          return nativeToScVal(arg, { type: 'u64' });
        }
      }
      
      // Default number handling
      if (typeof arg === 'number') {
        console.log(`  → Default number (u64): ${arg}`);
        return nativeToScVal(arg, { type: 'u64' });
      }
      
      // Default handling
      console.log(`  → Default: ${arg}`);
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
    console.log('🔏 Starting transaction signing process...');
    console.log('📋 XDR to sign:', xdr.substring(0, 100) + '...');
    
    const server = getServer();
    if (!server) throw new Error('Server not available on server side');
    
    if (typeof window === 'undefined') {
      throw new Error('Freighter wallet not available on server side');
    }

    console.log('🌐 Network passphrase:', NETWORK_CONFIG.networkPassphrase);
    
    // Get the connected address from Freighter
    console.log('📍 Getting connected address from Freighter...');
    const { address: connectedAddress } = await getAddress();
    console.log('✅ Connected address:', connectedAddress);
    
    // Sign the transaction with Freighter
    console.log('✍️ Requesting signature from Freighter...');
    const signedResult = await signTransaction(xdr, { 
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      address: connectedAddress
    });
    
    console.log('✅ Transaction signed successfully');
    console.log('📋 Signed XDR:', signedResult.signedTxXdr.substring(0, 100) + '...');
    
    // Parse the signed transaction
    const transaction = TransactionBuilder.fromXDR(signedResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    
    console.log('📤 Submitting transaction to network...');
    const result = await server.sendTransaction(transaction);
    
    console.log('🎉 Transaction submitted:', result);
    console.log('🔗 Transaction status:', result.status);
    console.log('🆔 Transaction hash:', result.hash);
    
    // Check if transaction was successful
    if (result.status === 'PENDING') {
      console.log('⏳ Transaction is pending, waiting for confirmation...');
      
      // Wait a bit and check the result
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const finalResult = await server.getTransaction(result.hash);
        console.log('✅ Final transaction result:', finalResult);
        return {
          status: finalResult.status,
          hash: result.hash,
          result: finalResult
        };
      } catch (e) {
        console.log('⚠️ Could not get final result, but transaction was submitted');
        return {
          status: 'PENDING',
          hash: result.hash,
          result: result
        };
      }
    }
    
    return {
      status: result.status,
      hash: result.hash,
      result: result
    };
  } catch (error) {
    console.error('❌ Transaction signing/submission error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('User declined')) {
        throw new Error('Transaction cancelled by user');
      }
      if (error.message.includes('Invalid signature')) {
        throw new Error('Invalid transaction signature');
      }
      if (error.message.includes('network')) {
        throw new Error('Network error - please check your connection');
      }
    }
    
    throw error;
  }
};

// Helper functions for specific contracts
export const salaryStreamingMethods = {
  createStream: (employer: string, employee: string, totalAmount: number, durationSeconds: number) =>
    buildContractTransaction(CONTRACT_ADDRESSES.SALARY_STREAMING, 'create_stream', [employer, employee, totalAmount, durationSeconds], employer),
  
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
