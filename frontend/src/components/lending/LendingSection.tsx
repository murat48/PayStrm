'use client';

import { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, DollarSign, CheckCircle, XCircle, Users, Clock } from 'lucide-react';
import { lendingMethods, signAndSubmitTransaction } from '@/lib/stellar-working';

interface LendingSectionProps {
  publicKey: string;
}

interface Loan {
  id: number;
  borrower: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Repaid' | 'Defaulted';
  riskTier: number;
  interestRate: number;
  createdAt: Date;
  repaidAmount: number;
  collateralStreamId: number;
}

// Helper function to convert Soroban enum status to string
const getStatusString = (status: any): 'Pending' | 'Approved' | 'Repaid' | 'Defaulted' => {
  if (typeof status === 'string') return status as any;
  if (typeof status === 'object' && status !== null) {
    // Soroban enums are returned as objects with a property name matching the variant
    if ('Pending' in status) return 'Pending';
    if ('Approved' in status) return 'Approved';
    if ('Repaid' in status) return 'Repaid';
    if ('Defaulted' in status) return 'Defaulted';
    // If it's an array, take the first element as the variant name
    if (Array.isArray(status) && status.length > 0) {
      return status[0] as any;
    }
  }
  // Default fallback
  return 'Pending';
};

export default function LendingSection({ publicKey }: LendingSectionProps) {
  const [allLoans, setAllLoans] = useState<Loan[]>([]); // For admin view
  const [userLoans, setUserLoans] = useState<Loan[]>([]); // For employee view
  const [loanAmount, setLoanAmount] = useState('');
  const [riskTier, setRiskTier] = useState(3);
  const [collateralStreamId, setCollateralStreamId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRepaying, setIsRepaying] = useState<number | null>(null);
  const [isApproving, setIsApproving] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Check if current user is admin
  const isAdmin = publicKey === 'GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA';

  // Load loans from blockchain
  const loadLoans = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      console.log('🌐 Loading loans from blockchain for:', publicKey);
      
      let userParsedLoans: Loan[] = [];
      let adminParsedLoans: Loan[] = [];
      
      // Always get user's own loans first
      const borrowerLoanIds = await lendingMethods.getBorrowerLoans(publicKey);
      console.log('✅ Borrower loan IDs:', borrowerLoanIds);
      
      if (borrowerLoanIds && Array.isArray(borrowerLoanIds)) {
        // Get detailed loan information for each loan ID
        const loanPromises = borrowerLoanIds.map(async (loanId: number) => {
          try {
            const loanData = await lendingMethods.getLoan(loanId);
            return {
              id: loanData.id,
              borrower: loanData.borrower,
              amount: parseInt(loanData.amount) / 10000000, // stroops to XLM
              status: getStatusString(loanData.status), // Convert Soroban enum to string
              riskTier: loanData.risk_tier,
              interestRate: loanData.interest_rate / 100, // Convert from basis points to percentage
              createdAt: new Date(parseInt(loanData.created_at) * 1000),
              repaidAmount: parseInt(loanData.repaid_amount) / 10000000, // stroops to XLM
              collateralStreamId: loanData.collateral_stream_id,
            };
          } catch (error) {
            console.error(`Failed to load loan ${loanId}:`, error);
            return null;
          }
        });
        
        const loans = await Promise.all(loanPromises);
        userParsedLoans = loans.filter(loan => loan !== null) as Loan[];
      }
      
      // If admin, also get ALL loans from all users
      if (isAdmin) {
        console.log('👑 Admin detected - loading ALL loans from the system...');
        try {
          const allLoanData = await lendingMethods.getAllLoans();
          console.log('✅ All loans raw data:', allLoanData);
          
          if (allLoanData && Array.isArray(allLoanData)) {
            adminParsedLoans = allLoanData.map((loanData: any) => ({
              id: loanData.id,
              borrower: loanData.borrower,
              amount: parseInt(loanData.amount) / 10000000, // stroops to XLM
              status: getStatusString(loanData.status), // Convert Soroban enum to string
              riskTier: loanData.risk_tier,
              interestRate: loanData.interest_rate / 100, // Convert from basis points to percentage
              createdAt: new Date(parseInt(loanData.created_at) * 1000),
              repaidAmount: parseInt(loanData.repaid_amount) / 10000000, // stroops to XLM
              collateralStreamId: loanData.collateral_stream_id,
            }));
          }
          
          console.log(`👑 Admin: Found ${adminParsedLoans.length} total loans in system`);
          console.log(`👤 User: Found ${userParsedLoans.length} personal loans`);
          setAllLoans(adminParsedLoans);
        } catch (adminError) {
          console.error('❌ Failed to load all loans for admin:', adminError);
          setAllLoans([]);
        }
      }
      
      // Always set user loans
      setUserLoans(userParsedLoans);
      
    } catch (error) {
      console.error('❌ Failed to load loans:', error);
      setAllLoans([]);
      setUserLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load loans on component mount and when publicKey changes
  useEffect(() => {
    loadLoans();
  }, [publicKey, isAdmin]);

  const requestLoan = async () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) return;
    if (!collateralStreamId || parseInt(collateralStreamId) <= 0) return;

    setIsRequesting(true);
    try {
      const amount = parseFloat(loanAmount) * 10000000; // Convert to stroops
      const streamId = parseInt(collateralStreamId);
      
      console.log('🌐 Requesting loan:', { amount, riskTier, streamId, publicKey });
      const xdr = await lendingMethods.requestLoan(amount, riskTier, streamId, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Clear the form
        setLoanAmount('');
        setCollateralStreamId('');
        setRiskTier(3);
        
        // Reload loans from blockchain
        await loadLoans();
        
        alert(`✅ Loan request submitted successfully!\n\n💰 Amount: ${loanAmount} XLM\n📊 Risk Tier: ${riskTier}\n🔗 Collateral Stream: #${streamId}\n📋 Status: Pending approval\n\nYour loan will be reviewed by the admin.`);
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
      
      console.log('🌐 Repaying loan:', { loanId, amount, publicKey });
      const xdr = await lendingMethods.repayLoan(loanId, amount, publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Clear the form
        setRepayAmount('');
        
        // Reload loans from blockchain
        await loadLoans();
        
        alert(`✅ Loan repayment successful!\n\n💰 Repaid: ${parseFloat(repayAmount)} XLM\n🆔 Loan ID: ${loanId}\n\nUpdated loan information loaded from blockchain.`);
      }
    } catch (error) {
      console.error('Failed to repay loan:', error);
      alert('Failed to repay loan. Please try again.');
    } finally {
      setIsRepaying(null);
    }
  };

  const approveLoan = async (loanId: number) => {
    if (!isAdmin) return;

    setIsApproving(loanId);
    try {
      console.log('🌐 Approving loan:', { loanId, publicKey });
      const xdr = await lendingMethods.approveLoan(loanId, publicKey);
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        await loadLoans(); // Reload from blockchain
        alert(`✅ Loan #${loanId} approved successfully!`);
      }
    } catch (error) {
      console.error('Failed to approve loan:', error);
      alert('Failed to approve loan. Please try again.');
    } finally {
      setIsApproving(null);
    }
  };

  const rejectLoan = async (loanId: number) => {
    if (!isAdmin) return;
    
    // if (!confirm('Are you sure you want to reject this loan application?')) {
    //   return;
    // }
    debugger;
       const xdr = await lendingMethods.rejectLoan(loanId,publicKey);
      
      if (xdr) {
        await signAndSubmitTransaction(xdr);
      }
    setIsRejecting(loanId);
    try {
      console.log('🌐 Rejecting loan:', { loanId, publicKey });
      
      // Call the actual contract method for rejecting loan
      // const xdr = await lendingMethods.rejectLoan(loanId, "Loan rejected by admin", publicKey);
      const xdr = await lendingMethods.rejectLoan(loanId,publicKey);
      if (xdr) {
        await signAndSubmitTransaction(xdr);
        
        // Reload loans from blockchain to get updated state
        await loadLoans();
        
        alert(`❌ Loan #${loanId} has been rejected.`);
      }
      
    } catch (error) {
      console.error('Failed to reject loan:', error);
      alert('Failed to reject loan. Please try again.');
    } finally {
      setIsRejecting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Repaid': return 'text-blue-600 bg-blue-100';
      case 'Defaulted': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Stats - Show only for non-admin users */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">My Loans</h3>
                <p className="text-2xl font-bold text-blue-600">{userLoans.length}</p>
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
                <p className="text-2xl font-bold text-red-600">
                  {userLoans
                    .filter(loan => loan.status === 'Approved')
                    .reduce((sum, loan) => sum + (loan.amount - loan.repaidAmount), 0)
                    .toFixed(2)} XLM
                </p>
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
      )}

      {/* Request Loan - Show for non-admin or admin in user mode */}
      {!isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-6 h-6 text-purple-600 mr-2" />
            Request Loan
          </h2>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Tier (1-5)
              </label>
              <select
                value={riskTier}
                onChange={(e) => setRiskTier(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>Tier 1 (4.0% APR)</option>
                <option value={2}>Tier 2 (4.5% APR)</option>
                <option value={3}>Tier 3 (5.0% APR)</option>
                <option value={4}>Tier 4 (5.5% APR)</option>
                <option value={5}>Tier 5 (6.0% APR)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract ID
              </label>
              <input
                type="number"
                value={collateralStreamId}
                onChange={(e) => setCollateralStreamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder=" ID"
                min="1"
              />
            </div>
          </div>
          
          <div className="flex items-end mb-4">
            <button
              onClick={requestLoan}
              disabled={isRequesting || !loanAmount || parseFloat(loanAmount) <= 0 || !collateralStreamId}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
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
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Loan Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Selected Rate:</span>
                <div className="font-medium">{riskTier === 1 ? '4.0%' : riskTier === 2 ? '4.5%' : riskTier === 3 ? '5.0%' : riskTier === 4 ? '5.5%' : '6.0%'} APR</div>
              </div>
              <div>
                <span className="text-gray-600">Max by Tier:</span>
                <div className="font-medium">{riskTier === 1 ? '80%' : riskTier === 2 ? '65%' : riskTier === 3 ? '50%' : riskTier === 4 ? '35%' : '25%'} of stream</div>
              </div>
              <div>
                <span className="text-gray-600">Collateral:</span>
                <div className="font-medium">Salary Stream</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="font-medium">Needs Admin Approval</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Stats - Only show for admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">All Loans</h3>
                <p className="text-2xl font-bold text-purple-600">{allLoans.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {allLoans.filter(loan => loan.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Approved</h3>
                <p className="text-2xl font-bold text-green-600">
                  {allLoans.filter(loan => loan.status === 'Approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Risk</h3>
                <p className="text-2xl font-bold text-red-600">
                  {allLoans
                    .filter(loan => loan.status === 'Approved')
                    .reduce((sum, loan) => sum + (loan.amount - loan.repaidAmount), 0)
                  } XLM
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loan History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isAdmin ? 'All Loan Applications (Admin View)' : 'My Loans'}
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading loans from blockchain...</p>
          </div>
        ) : (isAdmin ? allLoans : userLoans).length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {isAdmin ? 'No loan applications found' : 'No loans found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(isAdmin ? allLoans : userLoans).map((loan) => (
              <div key={loan.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Loan #{loan.id}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {loan.createdAt.toLocaleDateString()}
                    </p>
                    {/* Show borrower address in admin view */}
                    {isAdmin && (
                      <p className="text-sm text-gray-600 mt-1">
                        Borrower: {loan.borrower.substring(0, 8)}...{loan.borrower.substring(loan.borrower.length - 4)}
                      </p>
                    )}
                    {/* Show risk tier and collateral info */}
                    <p className="text-sm text-gray-600 mt-1">
                      Risk Tier: {loan.riskTier} | Collateral Stream: #{loan.collateralStreamId}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                      {loan.status.toUpperCase()}
                    </span>
                    
                    {/* Admin Controls */}
                    {isAdmin && loan.status === 'Pending' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => approveLoan(loan.id)}
                          disabled={isApproving === loan.id}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-2 py-1 text-xs rounded flex items-center space-x-1"
                        >
                          {isApproving === loan.id ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          <span>{isApproving === loan.id ? 'Approving...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => rejectLoan(loan.id)}
                          disabled={isRejecting === loan.id}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-2 py-1 text-xs rounded flex items-center space-x-1"
                        >
                          {isRejecting === loan.id ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{isRejecting === loan.id ? 'Rejecting...' : 'Reject'}</span>
                        </button>
                      </div>
                    )}
                  </div>
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
                
                {/* Repayment Controls - Only for borrower and approved loans */}
                {!isAdmin && loan.status === 'Approved' && loan.amount > loan.repaidAmount && loan.borrower === publicKey && (
                  <div className="flex space-x-2 mb-4">
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
                
                {/* Show repayment message for admin view */}
                {isAdmin && loan.status === 'Approved' && loan.amount > loan.repaidAmount && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Borrower can repay this loan from their account
                    </p>
                  </div>
                )}
                
                {/* Rejected loan message */}
                {loan.status === 'Defaulted' && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">
                      ❌ This loan has defaulted
                    </p>
                  </div>
                )}
                
                {/* Progress Bar */}
                {loan.status === 'Approved' && (
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
