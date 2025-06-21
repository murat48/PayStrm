'use client';

import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { lendingMethods, signAndSubmitTransaction } from '@/lib/stellar-working';

interface LendingSectionProps {
  publicKey: string;
}

interface Loan {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'repaid';
  interestRate: number;
  createdAt: Date;
  repaidAmount: number;
}

export default function LendingSection({ publicKey }: LendingSectionProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanAmount, setLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRepaying, setIsRepaying] = useState<number | null>(null);
  const [outstandingAmount, setOutstandingAmount] = useState(0);

  // Mock data for demo
  useEffect(() => {
    const mockLoans: Loan[] = [
      {
        id: 1,
        amount: 1000,
        status: 'approved',
        interestRate: 5.5,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        repaidAmount: 300,
      },
      {
        id: 2,
        amount: 500,
        status: 'pending',
        interestRate: 5.5,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        repaidAmount: 0,
      },
    ];
    setLoans(mockLoans);
    
    // Calculate outstanding amount
    const outstanding = mockLoans
      .filter(loan => loan.status === 'approved')
      .reduce((sum, loan) => sum + (loan.amount - loan.repaidAmount), 0);
    setOutstandingAmount(outstanding);
  }, []);

  const requestLoan = async () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) return;

    setIsRequesting(true);
    try {
      const amount = parseFloat(loanAmount) * 10000000; // Convert to stroops
      
      const xdr = await lendingMethods.requestLoan(amount, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Add to local state
        const newLoan: Loan = {
          id: loans.length + 1,
          amount: parseFloat(loanAmount),
          status: 'pending',
          interestRate: 5.5, // Default rate
          createdAt: new Date(),
          repaidAmount: 0,
        };
        
        setLoans([...loans, newLoan]);
        setLoanAmount('');
      }
    } catch (error) {
      console.error('Failed to request loan:', error);
      alert('Failed to request loan. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const repayLoan = async (loanId: number) => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return;

    setIsRepaying(loanId);
    try {
      const amount = parseFloat(repayAmount) * 10000000; // Convert to stroops
      
      const xdr = await lendingMethods.repayLoan(loanId, amount, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Update local state
        setLoans(loans.map(loan => 
          loan.id === loanId 
            ? { ...loan, repaidAmount: loan.repaidAmount + parseFloat(repayAmount) }
            : loan
        ));
        setRepayAmount('');
      }
    } catch (error) {
      console.error('Failed to repay loan:', error);
      alert('Failed to repay loan. Please try again.');
    } finally {
      setIsRepaying(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'repaid': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Loans</h3>
              <p className="text-2xl font-bold text-blue-600">{loans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Outstanding</h3>
              <p className="text-2xl font-bold text-red-600">{outstandingAmount} XLM</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Available Credit</h3>
              <p className="text-2xl font-bold text-green-600">2,500 XLM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Loan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-6 h-6 text-purple-600 mr-2" />
          Request Loan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount (XLM)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="1000"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={requestLoan}
              disabled={isRequesting || !loanAmount || parseFloat(loanAmount) <= 0}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Request Loan</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Loan Terms</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Interest Rate:</span>
              <div className="font-medium">5.5% APR</div>
            </div>
            <div>
              <span className="text-gray-600">Max Amount:</span>
              <div className="font-medium">2,500 XLM</div>
            </div>
            <div>
              <span className="text-gray-600">Term:</span>
              <div className="font-medium">12 months</div>
            </div>
            <div>
              <span className="text-gray-600">Collateral:</span>
              <div className="font-medium">Salary Stream</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Loans</h2>
        
        {loans.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No loans found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Loan #{loan.id}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {loan.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                    {loan.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">{loan.amount} XLM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{loan.interestRate}% APR</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Repaid</p>
                    <p className="font-medium">{loan.repaidAmount} XLM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="font-medium text-red-600">{loan.amount - loan.repaidAmount} XLM</p>
                  </div>
                </div>
                
                {loan.status === 'approved' && loan.amount > loan.repaidAmount && (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Repay amount"
                      min="0"
                      step="0.01"
                      max={loan.amount - loan.repaidAmount}
                    />
                    <button
                      onClick={() => repayLoan(loan.id)}
                      disabled={isRepaying === loan.id || !repayAmount || parseFloat(repayAmount) <= 0}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      {isRepaying === loan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Repaying...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>Repay</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Progress Bar */}
                {loan.status === 'approved' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Repayment Progress</span>
                      <span>{((loan.repaidAmount / loan.amount) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(loan.repaidAmount / loan.amount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
