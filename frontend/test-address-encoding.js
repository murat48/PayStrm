#!/usr/bin/env node

// Quick test to verify address encoding with Stellar SDK
const { Address, nativeToScVal } = require('@stellar/stellar-sdk');

const testAddress = 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA';

console.log('Testing address encoding...');
console.log('Test address:', testAddress);

try {
    // Method 1: Address.fromString()
    console.log('\n📍 Method 1: Address.fromString()');
    const addressObj = Address.fromString(testAddress);
    const addressScVal = addressObj.toScVal();
    console.log('✅ Address object created');
    console.log('ScVal type:', addressScVal.switch().name);
    console.log('ScVal:', addressScVal);
    
    // Method 2: nativeToScVal with address type
    console.log('\n📍 Method 2: nativeToScVal');
    const nativeScVal = nativeToScVal(testAddress, { type: 'address' });
    console.log('✅ Native ScVal created');
    console.log('Native ScVal type:', nativeScVal.switch().name);
    console.log('Native ScVal:', nativeScVal);
    
    // Compare both methods
    console.log('\n🔍 Comparison:');
    console.log('Both methods produce same result:', 
        addressScVal.switch().name === nativeScVal.switch().name);
    
} catch (error) {
    console.error('❌ Error:', error);
}
