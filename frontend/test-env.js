// Test environment variables
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../src/lib/contracts';

console.log('=== Environment Variables Test ===');
console.log('Network:', NETWORK_CONFIG.environment);
console.log('Network Passphrase:', NETWORK_CONFIG.networkPassphrase);
console.log('RPC URL:', NETWORK_CONFIG.rpcUrl);
console.log('');
console.log('Contract Addresses:');
console.log('- Lending:', CONTRACT_ADDRESSES.LENDING);
console.log('- Salary Streaming:', CONTRACT_ADDRESSES.SALARY_STREAMING);
console.log('- Work Profile:', CONTRACT_ADDRESSES.WORK_PROFILE);
console.log('');
console.log('Environment vars from process.env:');
console.log('- NEXT_PUBLIC_ENVIRONMENT:', process.env.NEXT_PUBLIC_ENVIRONMENT);
console.log('- NEXT_PUBLIC_LENDING_CONTRACT_ID:', process.env.NEXT_PUBLIC_LENDING_CONTRACT_ID);
console.log('===================================');
