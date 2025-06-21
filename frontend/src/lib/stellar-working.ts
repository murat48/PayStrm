import { rpc, Contract, TransactionBuilder, Account, xdr, scValToNative, nativeToScVal, Address, StrKey, Operation } from '@stellar/stellar-sdk';
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
export const buildContractTransactionFreighter = async (
  contractAddress: string,
  method: string,
  args: any[] = []
) => {
  try {
    console.log('🔧 Building Freighter transaction:');
    console.log('  📋 Contract ID:', contractAddress);
    console.log('  🎯 Method:', method);
    console.log('  📝 Args:', args);
    console.log('  🔑 Using Freighter for signing');
    
    const server = getServer();
    if (!server) throw new Error('Server not available');
    
    // 🚨 FREIGHTER ADDRESS AL - secret key yok!
    const { getAddress } = await import('@stellar/freighter-api');
    const freighterResult = await getAddress();
    
    if (!freighterResult.address) {
      throw new Error('Freighter address not available. Please connect your wallet.');
    }
    
    const freighterPublicKey = freighterResult.address;
    console.log('  🔑 Freighter Public Key:', freighterPublicKey);
    
    const contract = createContract(contractAddress);
    
    // 🚨 FREIGHTER PUBLIC KEY ile account al
    const account = await server.getAccount(freighterPublicKey);
    console.log('✅ Account loaded for Freighter public key:', freighterPublicKey);
    
    // Convert arguments exactly like CLI does - ama secret key yok
    const scArgs = args.map((arg, index) => {
      console.log(`Freighter arg conversion ${index}:`, arg, typeof arg);
      
      if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
        console.log(`  → Address: ${arg}`);
        return nativeToScVal(arg, { type: 'address' });
      }
      
      if (typeof arg === 'number') {
        // Method-specific conversions (CLI-compatible)
        if (method === 'withdraw') {
          if (index === 0) { // stream_id -> u32
            console.log(`  → u32 (stream_id): ${arg}`);
            return nativeToScVal(arg, { type: 'u32' });
          }
          if (index === 1) { // amount -> i128 with BigInt
            console.log(`  → i128 with BigInt: ${arg}`);
            return nativeToScVal(BigInt(arg), { type: 'i128' });
          }
        }
        
        if (method === 'create_stream') {
          if (index === 0) { // employer -> address (already handled above)
            return nativeToScVal(arg, { type: 'address' });
          }
          if (index === 1) { // employee -> address (already handled above)
            return nativeToScVal(arg, { type: 'address' });
          }
          if (index === 2) { // total_amount -> i128
            console.log(`  → i128 (total_amount): ${arg}`);
            return nativeToScVal(BigInt(arg), { type: 'i128' });
          }
          if (index === 3) { // duration_seconds -> u64
            console.log(`  → u64 (duration): ${arg}`);
            return nativeToScVal(arg, { type: 'u64' });
          }
        }
        
        if (method === 'pause_stream' || method === 'resume_stream' || method === 'end_stream') {
          if (index === 0) { // stream_id -> u32
            console.log(`  → u32 (stream_id): ${arg}`);
            return nativeToScVal(arg, { type: 'u32' });
          }
        }
        
        // Default: u64 for numbers
        console.log(`  → default u64: ${arg}`);
        return nativeToScVal(arg, { type: 'u64' });
      }
      
      console.log(`  → default: ${arg}`);
      return nativeToScVal(arg);
    });

    console.log('\n🏗️ Building transaction for Freighter...');
    console.log('🔧 Transaction will be signed by Freighter:');
    console.log(`  Contract: ${contractAddress}`);
    console.log(`  Method: ${method}`);
    console.log(`  Signer: ${freighterPublicKey}`);
    
    // 🚨 FREIGHTER COMPATIBLE TRANSACTION BUILDING
    const transaction = new TransactionBuilder(account, {
      fee: '1000000', // High fee for Soroban contracts
      networkPassphrase: NETWORK_CONFIG.networkPassphrase, // Use your network config
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(300) // 5 minutes timeout
      .build();

    console.log('🧪 Simulating transaction...');
    const simulation = await server.simulateTransaction(transaction);
    
    if (rpc.Api.isSimulationError(simulation)) {
      console.error('❌ Freighter simulation failed:', simulation);
      console.error('❌ Error details:', simulation.error);
      console.error('❌ Events:', simulation.events);
      throw new Error(`Transaction simulation failed: ${simulation.error}`);
    }
    
    console.log('✅ Freighter simulation successful');
    console.log('📊 Simulation result:', simulation.result);
    
    // Prepare transaction for Freighter signing
    const preparedTransaction = await server.prepareTransaction(transaction);

    console.log('🎯 Freighter transaction prepared');
    console.log('💰 Final fee:', preparedTransaction.fee);
    console.log('📊 Source account:', preparedTransaction.source);
    console.log('📊 Freighter address:', freighterPublicKey);
    console.log('📊 Match:', preparedTransaction.source === freighterPublicKey);
    console.log('🔐 Ready for Freighter signing');

    return preparedTransaction.toXDR();
  } catch (error) {
    console.error('❌ Freighter transaction build error:', error);
    
    // Specific error messages for better debugging
    // if (error.message.includes('account not found')) {
    //   throw new Error(`Account not found: ${freighterPublicKey}. Make sure your wallet is funded and connected to the correct network.`);
    // }
    
    // if (error.message.includes('Freighter address not available')) {
    //   throw new Error('Freighter wallet not connected. Please connect your wallet and try again.');
    // }
    
    throw error;
  }
};

// 🚀 UPDATED WITHDRAW FUNCTION - Secret key yok!
export const withdrawWithFreighter = async (streamId: number, amount: number) => {
  try {
    console.log('💸 FREIGHTER WITHDRAW (No Secret Key):');
    console.log('  Stream ID:', streamId);
    console.log('  Amount:', amount, 'stroops');
    console.log('  Amount XLM:', amount / 10000000);
    
    // Freighter address al - secret key'e gerek yok
    const { getAddress } = await import('@stellar/freighter-api');
    const freighterResult = await getAddress();
    const freighterAddress = freighterResult.address;
    
    console.log('  🔑 Your Freighter address:', freighterAddress);
    
    // Stream kontrol et
    console.log('  🔍 Checking stream authorization...');
    const stream = await salaryStreamingMethods.getStream(streamId);
    console.log('  📋 Stream employee:', stream.employee);
    console.log('  👤 Your address:', freighterAddress);
    console.log('  ✅ Authorized:', stream.employee === freighterAddress);
    
    if (stream.employee !== freighterAddress) {
      throw new Error(`Authorization failed: You (${freighterAddress}) are not the employee of this stream (${stream.employee}). Please use the correct account or create a new stream.`);
    }
    
    // Available balance kontrol et
    const available = await salaryStreamingMethods.getAvailableBalance(streamId);
    console.log('  💰 Available balance:', available, 'stroops');
    
    if (amount > available) {
      throw new Error(`Insufficient funds. Requested: ${amount} stroops, Available: ${available} stroops`);
    }
    
    // Transaction build et - secret key kullanmıyor
    console.log('  🏗️ Building transaction...');
    const xdr = await buildContractTransactionFreighter(
      CONTRACT_ADDRESSES.SALARY_STREAMING,
      'withdraw',
      [streamId, amount]
    );
    
    console.log('✅ Transaction built successfully');
    console.log('🔐 Signing with Freighter...');
    
    // Freighter ile sign ve submit
    const result = await signAndSubmitTransaction(xdr);
    
    console.log('🎉 Freighter withdraw successful!');
    console.log('📊 Transaction result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Freighter withdraw failed:', error);
    
    // Better error messages
    // if (error.message.includes('Authorization failed')) {
    //   console.error('💡 Solution: Create a new stream for your Freighter account');
    // }
    
    // if (error.message.includes('Insufficient funds')) {
    //   console.error('💡 Solution: Wait for more funds to vest or withdraw a smaller amount');
    // }
    
    throw error;
  }
};

// 🎯 USAGE EXAMPLES - Secret key yok!

// Example 1: Simple withdraw
export const handleSimpleWithdraw = async (streamId: number, amount: number) => {
  try {
    await withdrawWithFreighter(streamId, amount);
    console.log('Withdraw completed!');
  } catch (error) {
    // console.error('Withdraw failed:', error.message);
    // alert('Withdraw failed: ' + error.message);
  }
};

// Example 2: Withdraw all available
export const handleWithdrawAll = async (streamId: number) => {
  try {
    const available = await salaryStreamingMethods.getAvailableBalance(streamId);
    if (available > 0) {
      await withdrawWithFreighter(streamId, available);
      console.log('All available funds withdrawn!');
    } else {
      console.log('No funds available to withdraw');
    }
  } catch (error) {
    // console.error('Withdraw all failed:', error.message);
    // alert('Withdraw failed: ' + error.message);
  }
};

// Example 3: Create stream for current user (no secret key)
export const createStreamForSelf = async (totalAmount: number, durationSeconds: number) => {
  try {
    const { getAddress } = await import('@stellar/freighter-api');
    const freighterResult = await getAddress();
    const freighterAddress = freighterResult.address;
    
    // Self-employed: employer and employee are the same
    const xdr = await buildContractTransactionFreighter(
      CONTRACT_ADDRESSES.SALARY_STREAMING,
      'create_stream',
      [freighterAddress, freighterAddress, totalAmount, durationSeconds]
    );
    
    const result = await signAndSubmitTransaction(xdr);
    console.log('✅ Self-employed stream created!');
    return result;
    
  } catch (error) {
    console.error('Stream creation failed:', error);
    throw error;
  }
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
    const scArgs = args.map((arg, index) => {
      console.log(`Converting arg ${index}:`, arg, typeof arg);
      
      if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
        console.log(`  → Address: ${arg}`);
        // Always use nativeToScVal for consistency with working CLI
        const addressScVal = nativeToScVal(arg, { type: 'address' });
        console.log(`  → Address ScVal created successfully for: ${arg}`);
        console.log(`  → ScVal type:`, addressScVal.switch().name);
        return addressScVal;
      }
      
      if (typeof arg === 'number') {
        if (method === 'create_stream') {
          if (index === 2) { // total_amount -> i128
            console.log(`  → i128: ${arg}`);
            return nativeToScVal(arg, { type: 'i128' });
          }
          if (index === 3) { // duration_seconds -> u64
            console.log(`  → u64: ${arg}`);
            return nativeToScVal(arg, { type: 'u64' });
          }
        }
        
        if (method === 'withdraw') {
          if (index === 0) { // stream_id -> u32
            console.log(`  → u32 (stream_id): ${arg}`);
            return nativeToScVal(arg, { type: 'u32' });
          }
          if (index === 1) { // amount -> i128
            console.log(`  → i128 (amount): ${arg}`);
            return nativeToScVal(arg, { type: 'i128' });
          }
        }
        
        // Stream management methods use u32 for stream_id
        if (method === 'pause_stream' || method === 'resume_stream' || method === 'end_stream' || method === 'get_stream') {
          if (index === 0) { // stream_id -> u32
            console.log(`  → u32 (stream_id for ${method}): ${arg}`);
            return nativeToScVal(arg, { type: 'u32' });
          }
        }
        
        // Default number handling
        console.log(`  → Default u64: ${arg}`);
        return nativeToScVal(arg, { type: 'u64' });
      }
      
      console.log(`  → Default: ${arg}`);
      return nativeToScVal(arg);
    });

    console.log('\n🏗️ Building Soroban transaction...');
    console.log('🔧 Using contract.call() for proper Soroban formatting');
    
    const transaction = new TransactionBuilder(account, {
      fee: '100', // Much higher fee for Soroban contract calls (1 XLM)
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(300) // 5 minutes
      .build();

    console.log('🧪 Simulating transaction for accurate resource estimation...');
    const simulation = await server.simulateTransaction(transaction);
    
    if (rpc.Api.isSimulationError(simulation)) {
      console.error('❌ Transaction simulation failed:', simulation);
      throw new Error(`Transaction simulation failed: ${simulation.error}`);
    }
    
    console.log('✅ Transaction simulation successful');
    console.log('📊 Simulation result:', simulation.result);
    
    // Build the final transaction with proper resource footprint
    const preparedTransaction = await server.prepareTransaction(transaction);

    console.log('🎯 Transaction prepared with Soroban resource footprint');
    console.log('💰 Final fee:', preparedTransaction.fee);
    console.log('📊 Prepared transaction operations:', preparedTransaction.operations.length);
    console.log('📊 First operation type:', preparedTransaction.operations[0].type);
    console.log('📊 Transaction source account:', preparedTransaction.source);
    console.log('📊 Network passphrase:', NETWORK_CONFIG.networkPassphrase);

    return preparedTransaction.toXDR();
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
    
    // Convert arguments to ScVal format
    const scArgs = args.map(arg => {
      if (typeof arg === 'string') return nativeToScVal(arg, { type: 'address' });
      if (typeof arg === 'number') return nativeToScVal(arg, { type: 'u64' });
      return nativeToScVal(arg);
    });

    // For read operations, we can simulate the call with a dummy account
    const dummyAccount = new Account('GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA', '110');
    
    const transaction = new TransactionBuilder(dummyAccount, {
      fee: '10000',
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...scArgs))
      .setTimeout(300)
      .build();

    const response = await server.simulateTransaction(transaction);
    debugger;
    if (rpc.Api.isSimulationSuccess(response)) {
      return scValToNative(response.result!.retval);
    } else {
      console.error('Contract simulation failed:', response);
      throw new Error('Contract simulation failed');
    }
  } catch (error) {
    console.error('Read contract error:', error);
    throw error;
  }
};

// Sign and submit transaction using Freighter
export const signAndSubmitTransaction = async (xdr: string) => {
  try {
    console.log('🔏 [STEP 1] Starting transaction signing process...');
    console.log('📋 XDR to sign (first 100 chars):', xdr.substring(0, 100) + '...');
    
    const server = getServer();
    if (!server) {
      console.error('❌ Server not available on client side');
      throw new Error('Server not available on client side');
    }
    console.log('✅ [STEP 1] Server initialized');
    
    if (typeof window === 'undefined') {
      console.error('❌ Window not available');
      throw new Error('Freighter wallet not available on server side');
    }
    console.log('✅ [STEP 1] Window available');

    console.log('🌐 Network passphrase:', NETWORK_CONFIG.networkPassphrase);
    console.log('🌐 RPC URL:', NETWORK_CONFIG.rpcUrl);
    console.log('🌐 Environment:', NETWORK_CONFIG.environment);
    
    // Sign the transaction with Freighter
    console.log('✍️ [STEP 2] Requesting signature from Freighter...');
    console.log('📋 About to call signTransaction with XDR length:', xdr.length);
    console.log('🌐 Network for signing:', NETWORK_CONFIG.networkPassphrase);
    console.log('🚨 ÖNEMLI: Freighter\'da "Invoke Host Function" seçeneğini görmelisiniz!');
    
    let signedResult;
    try {
      signedResult = await signTransaction(xdr, { 
        networkPassphrase: NETWORK_CONFIG.networkPassphrase
      });
      console.log('✅ [STEP 2] signTransaction call completed');
    } catch (signError) {
      console.error('❌ [STEP 2] signTransaction failed:', signError);
      console.error('❌ [STEP 2] Error type:', typeof signError);
      console.error('❌ [STEP 2] Error message:', signError instanceof Error ? signError.message : String(signError));
      throw signError;
    }
    
    console.log('✅ [STEP 2] Transaction signed successfully');
    console.log('📋 Signed XDR length:', signedResult.signedTxXdr.length);
    console.log('📋 Signed XDR (first 100 chars):', signedResult.signedTxXdr.substring(0, 100) + '...');
    
    // Parse the signed transaction
    console.log('🔄 [STEP 3] Parsing signed transaction...');
    const transaction = TransactionBuilder.fromXDR(signedResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    console.log('✅ [STEP 3] Transaction parsed successfully');
    
    console.log('📤 [STEP 4] Submitting transaction to network...');
    console.log('🌐 RPC URL:', NETWORK_CONFIG.rpcUrl);
    
    const result = await server.sendTransaction(transaction);
    
    console.log('🎉 [STEP 4] Transaction submitted!');
    console.log('📊 Full result object:', result);
    console.log('🔗 Transaction status:', result.status);
    console.log('🆔 Transaction hash:', result.hash);
    
    // For Soroban transactions, check the actual result
    if (result.status === 'PENDING') {
      console.log('⏳ [STEP 5] Transaction is pending, waiting for confirmation...');
      
      // Wait a bit and then check the result
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        console.log('🔍 [STEP 5] Checking final transaction result...');
        const finalResult = await server.getTransaction(result.hash);
        console.log('✅ [STEP 5] Final transaction result:', finalResult);
        
        return {
          status: finalResult.status,
          hash: result.hash,
          result: finalResult
        };
      } catch (e) {
        console.log('⚠️ [STEP 5] Could not get final result, but transaction was submitted');
        console.log('⚠️ Error getting final result:', e);
        return {
          status: 'PENDING',
          hash: result.hash,
          result: result
        };
      }
    }
    
    console.log('✅ [FINAL] Transaction completed with status:', result.status);
    return {
      status: result.status,
      hash: result.hash,
      result: result
    };
  } catch (error) {
    console.error('❌ [ERROR] Transaction signing/submission error:', error);
    console.error('❌ [ERROR] Error type:', typeof error);
    console.error('❌ [ERROR] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('User declined') || error.message.includes('User rejected')) {
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
  
  getEmployerStreams: (employer: string) =>
    readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'get_employer_streams', [employer]),
  
  getStream: (streamId: number) =>
    readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'get_stream', [streamId]),
 // YENİ METHOD - Tüm stream'ları getir
  getAllStreams: () =>
    readContract(CONTRACT_ADDRESSES.SALARY_STREAMING, 'get_all_streams', []),
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
  addWorkExperience: (title: string, company: string, startDate: number, endDate: number, publicKey: string) =>
    buildContractTransaction(CONTRACT_ADDRESSES.WORK_PROFILE, 'add_work_experience', [title, company, startDate, endDate], publicKey),
  
  getWorkProfile: (profileOwner: string) =>
    readContract(CONTRACT_ADDRESSES.WORK_PROFILE, 'get_work_profile', [profileOwner]),
};
