// Simple test script to debug contract parameters
import { salaryStreamingMethods } from './src/lib/stellar.js';

const testParams = {
  employer: 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA',
  employee: 'GBLV5FR2DYZPXK4MKVAJHKCAECNR2XYJMOWEDLBB7U2JPKOT2M5N2B3O',
  amount: 1000000000, // exact same as CLI
  duration: 2592000   // exact same as CLI
};

console.log('Testing with exact CLI parameters:');
console.log(testParams);

// This would test the parameter conversion
console.log('Parameters will be converted to:');
console.log('employer (string):', testParams.employer);
console.log('employee (string):', testParams.employee); 
console.log('amount (bigint):', BigInt(testParams.amount));
console.log('duration (bigint):', BigInt(testParams.duration));
