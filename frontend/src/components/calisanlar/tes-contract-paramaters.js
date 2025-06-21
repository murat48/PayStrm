// #!/usr/bin/env node

// // Test exact contract call parameters
// const { nativeToScVal } = require('@stellar/stellar-sdk');

// console.log('🧪 Testing exact contract call parameters...');

// // Exact parameters from CLI that works
// const employer = 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA';
// const employee = 'GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A';
// const totalAmount = 1000000000;
// const durationSeconds = 2592000;

// console.log('\n📋 Parameters:');
// console.log('Employer:', employer);
// console.log('Employee:', employee);
// console.log('Total Amount:', totalAmount);
// console.log('Duration Seconds:', durationSeconds);

// console.log('\n🔧 Converting to ScVals...');

// try {
//     // Convert exactly as our frontend does
//     const args = [employer, employee, totalAmount, durationSeconds];
    
//     const scArgs = args.map((arg, index) => {
//         console.log(`\nConverting arg ${index}:`, arg, typeof arg);
        
//         if (typeof arg === 'string' && arg.length === 56 && arg.startsWith('G')) {
//             console.log(`  → Address: ${arg}`);
//             const scVal = nativeToScVal(arg, { type: 'address' });
//             console.log(`  → ScVal type: ${scVal.switch().name}`);
//             return scVal;
//         }
        
//         if (typeof arg === 'number') {
//             if (index === 2) { // total_amount -> i128
//                 console.log(`  → i128: ${arg}`);
//                 const scVal = nativeToScVal(arg, { type: 'i128' });
//                 console.log(`  → ScVal type: ${scVal.switch().name}`);
//                 return scVal;
//             }
//             if (index === 3) { // duration_seconds -> u64
//                 console.log(`  → u64: ${arg}`);
//                 const scVal = nativeToScVal(arg, { type: 'u64' });
//                 console.log(`  → ScVal type: ${scVal.switch().name}`);
//                 return scVal;
//             }
//         }
        
//         console.log(`  → Default: ${arg}`);
//         return nativeToScVal(arg);
//     });

//     console.log('\n✅ All parameters converted successfully!');
//     console.log('ScArgs summary:');
//     scArgs.forEach((scVal, i) => {
//         console.log(`  ${i}: ${scVal.switch().name}`);
//     });
    
// } catch (error) {
//     console.error('❌ Error converting parameters:', error);
// }
