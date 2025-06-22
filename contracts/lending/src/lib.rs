

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum LoanStatus {
    Pending,
    Approved,
    Repaid,
    Defaulted,
}

#[derive(Clone)]
#[contracttype]
pub struct Loan {
    pub id: u32,
    pub borrower: Address,
    pub amount: i128,
    pub status: LoanStatus,
    pub risk_tier: u32,
    pub interest_rate: u32, // Basis points (e.g., 500 = 5%)
    pub created_at: u64,
    pub repaid_amount: i128,
    pub collateral_stream_id: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Transaction {
    pub id: u32,
    pub loan_id: u32,
    pub transaction_type: TransactionType,
    pub amount: i128,
    pub timestamp: u64,
    pub borrower: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum TransactionType {
    LoanRequest,
    LoanApproval,
    Repayment,
    Default,
}

#[derive(Clone)]
#[contracttype]
pub struct LoanSummary {
    pub total_loans: u32,
    pub total_amount: i128,
    pub pending_loans: u32,
    pub approved_loans: u32,
    pub repaid_loans: u32,
    pub defaulted_loans: u32,
    pub total_outstanding: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    LoanCounter,
    TransactionCounter,
    Loan(u32),
    Transaction(u32),
    BorrowerLoans(Address),
    RiskMultiplier(u32),
    AllLoanIds,
    AllTransactionIds,
}

#[contract]
pub struct LendingContract;

#[contractimpl]
impl LendingContract {
    /// Initialize contract with risk tier multipliers
    pub fn initialize(env: Env) {
        // Risk tier interest rates (basis points above base rate)
        env.storage().persistent().set(&DataKey::RiskMultiplier(1), &400u32); // Tier 1: 4% APR
        env.storage().persistent().set(&DataKey::RiskMultiplier(2), &450u32); // Tier 2: 4.5% APR
        env.storage().persistent().set(&DataKey::RiskMultiplier(3), &500u32); // Tier 3: 5% APR
        env.storage().persistent().set(&DataKey::RiskMultiplier(4), &550u32); // Tier 4: 5.5% APR
        env.storage().persistent().set(&DataKey::RiskMultiplier(5), &600u32); // Tier 5: 6% APR
        
        // Initialize empty loan and transaction lists
        let empty_vec: Vec<u32> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::AllLoanIds, &empty_vec);
        env.storage().persistent().set(&DataKey::AllTransactionIds, &empty_vec);
    }
    
    /// Requests a loan using salary stream as collateral
    /// Returns loan ID for tracking. Loan will be in Pending status until approved.
    pub fn request_loan(
        env: Env,
        borrower: Address,
        amount: i128,
        risk_tier: u32,
        collateral_stream_id: u32,
    ) -> u32 {
        // Require authorization from borrower
        borrower.require_auth();
        
        // Validate risk tier
        if risk_tier < 1 || risk_tier > 5 {
            panic!("Invalid risk tier");
        }
        
        // Validate loan amount (must be positive)
        if amount <= 0 {
            panic!("Loan amount must be positive");
        }
        
        // Check if borrower has any outstanding loans
        let outstanding = Self::get_outstanding_loans(env.clone(), borrower.clone());
        if outstanding > 0 {
            panic!("Borrower has outstanding loans");
        }
        
        // Get interest rate for risk tier
        let interest_rate: u32 = env.storage().persistent()
            .get(&DataKey::RiskMultiplier(risk_tier))
            .unwrap_or(600u32);
        
        // Get next loan ID
        let mut counter: u32 = env.storage().persistent().get(&DataKey::LoanCounter).unwrap_or(0);
        counter += 1;
        
        // Create loan in PENDING status - requires admin approval
        let loan = Loan {
            id: counter,
            borrower: borrower.clone(),
            amount,
            status: LoanStatus::Pending, // Always starts as Pending
            risk_tier,
            interest_rate,
            created_at: env.ledger().timestamp(),
            repaid_amount: 0,
            collateral_stream_id,
        };
        
        // Store loan
        env.storage().persistent().set(&DataKey::Loan(counter), &loan);
        env.storage().persistent().set(&DataKey::LoanCounter, &counter);
        
        // Add to borrower's loan list
        let mut borrower_loans: Vec<u32> = env.storage().persistent()
            .get(&DataKey::BorrowerLoans(borrower.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        borrower_loans.push_back(counter);
        env.storage().persistent().set(&DataKey::BorrowerLoans(borrower.clone()), &borrower_loans);
        
        // Add to all loans list
        let mut all_loans: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllLoanIds)
            .unwrap_or_else(|| Vec::new(&env));
        all_loans.push_back(counter);
        env.storage().persistent().set(&DataKey::AllLoanIds, &all_loans);
        
        // Record transaction
        Self::record_transaction(&env, counter, TransactionType::LoanRequest, amount, borrower);
        
        counter
    }
    
    /// Approves a pending loan (admin function)
    /// Validates loan details before approval
    pub fn approve_loan(env: Env, admin: Address, loan_id: u32) {
        // In a real implementation, you'd check admin permissions
        admin.require_auth();
        
        let mut loan: Loan = env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");
        
        // Only approve pending loans
        if !matches!(loan.status, LoanStatus::Pending) {
            panic!("Loan is not pending");
        }
        
        // Additional validation: Check if borrower still has no outstanding loans
        let outstanding = Self::get_outstanding_loans(env.clone(), loan.borrower.clone());
        if outstanding > 0 {
            panic!("Borrower has outstanding loans, cannot approve new loan");
        }
        
        // Approve the loan
        loan.status = LoanStatus::Approved;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
        
        // Record transaction
        Self::record_transaction(&env, loan_id, TransactionType::LoanApproval, loan.amount, loan.borrower);
    }
    
    /// Rejects a pending loan (admin function)
    pub fn reject_loan(env: Env, admin: Address, loan_id: u32) {
        admin.require_auth();
        
        let mut loan: Loan = env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");
        
        // Only reject pending loans
        if !matches!(loan.status, LoanStatus::Pending) {
            panic!("Loan is not pending");
        }
        
        // Mark as defaulted (using this status for rejected loans)
        loan.status = LoanStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
        
        // Record transaction (amount 0 for rejection)
        Self::record_transaction(&env, loan_id, TransactionType::Default, 0, loan.borrower);
        
        // In a real implementation, you might want to store the rejection reason
        // This could be added to the Transaction struct or as a separate field
    }
    
    /// Gets all pending loans waiting for approval
    pub fn get_pending_loans(env: Env) -> Vec<Loan> {
        Self::get_loans_by_status(env, LoanStatus::Pending)
    }
    
    /// Gets detailed loan information including risk assessment
    pub fn get_loan_details(env: Env, loan_id: u32) -> (Loan, u32, Vec<Transaction>) {
        let loan = Self::get_loan(env.clone(), loan_id);
        let max_percentage = Self::get_max_loan_percentage(env.clone(), loan.risk_tier);
        let transactions = Self::get_loan_transactions(env, loan_id);
        
        (loan, max_percentage, transactions)
    }
    
    /// Repays a loan
    pub fn repay_loan(env: Env, borrower: Address, loan_id: u32, amount: i128) -> i128 {
        // Require authorization from borrower
        borrower.require_auth();
        
        let mut loan: Loan = env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");
        
        // Check if borrower owns this loan
        if loan.borrower != borrower {
            panic!("Unauthorized");
        }
        
        // Only repay approved loans
        if !matches!(loan.status, LoanStatus::Approved) {
            panic!("Loan is not approved");
        }
        
        // Calculate remaining amount
        let remaining = loan.amount - loan.repaid_amount;
        let payment = if amount > remaining { remaining } else { amount };
        
        // Update repaid amount
        loan.repaid_amount += payment;
        
        // Check if fully repaid
        if loan.repaid_amount >= loan.amount {
            loan.status = LoanStatus::Repaid;
        }
        
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
        
        // Record transaction
        Self::record_transaction(&env, loan_id, TransactionType::Repayment, payment, borrower);
        
        payment
    }
    
    /// Marks a loan as defaulted (admin function)
    pub fn mark_default(env: Env, admin: Address, loan_id: u32) {
        admin.require_auth();
        
        let mut loan: Loan = env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");
        
        // Only default approved loans
        if !matches!(loan.status, LoanStatus::Approved) {
            panic!("Loan is not approved");
        }
        
        loan.status = LoanStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
        
        // Record transaction
        Self::record_transaction(&env, loan_id, TransactionType::Default, 0, loan.borrower);
    }
    
    /// Gets outstanding loans for a borrower
    pub fn get_outstanding_loans(env: Env, borrower: Address) -> i128 {
        let loan_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::BorrowerLoans(borrower))
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut total_outstanding = 0i128;
        
        for loan_id in loan_ids.iter() {
            let loan: Loan = env.storage().persistent()
                .get(&DataKey::Loan(loan_id))
                .unwrap();
            
            if matches!(loan.status, LoanStatus::Approved) {
                total_outstanding += loan.amount - loan.repaid_amount;
            }
        }
        
        total_outstanding
    }
    
    /// Gets loan details
    pub fn get_loan(env: Env, loan_id: u32) -> Loan {
        env.storage().persistent()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found")
    }
    
    /// Gets all loans for a borrower
    pub fn get_borrower_loans(env: Env, borrower: Address) -> Vec<u32> {
        env.storage().persistent()
            .get(&DataKey::BorrowerLoans(borrower))
            .unwrap_or_else(|| Vec::new(&env))
    }
    
    /// Gets all loans in the system
    pub fn get_all_loans(env: Env) -> Vec<Loan> {
        let loan_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllLoanIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut loans = Vec::new(&env);
        
        for loan_id in loan_ids.iter() {
            if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&DataKey::Loan(loan_id)) {
                loans.push_back(loan);
            }
        }
        
        loans
    }
    
    /// Gets loans by status
    pub fn get_loans_by_status(env: Env, status: LoanStatus) -> Vec<Loan> {
        let loan_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllLoanIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut filtered_loans = Vec::new(&env);
        
        for loan_id in loan_ids.iter() {
            if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&DataKey::Loan(loan_id)) {
                if matches!((loan.status.clone(), status.clone()), 
                           (LoanStatus::Pending, LoanStatus::Pending) |
                           (LoanStatus::Approved, LoanStatus::Approved) |
                           (LoanStatus::Repaid, LoanStatus::Repaid) |
                           (LoanStatus::Defaulted, LoanStatus::Defaulted)) {
                    filtered_loans.push_back(loan);
                }
            }
        }
        
        filtered_loans
    }
    
    /// Gets all transactions in the system
    pub fn get_all_transactions(env: Env) -> Vec<Transaction> {
        let transaction_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllTransactionIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut transactions = Vec::new(&env);
        
        for tx_id in transaction_ids.iter() {
            if let Some(transaction) = env.storage().persistent().get::<DataKey, Transaction>(&DataKey::Transaction(tx_id)) {
                transactions.push_back(transaction);
            }
        }
        
        transactions
    }
    
    /// Gets transactions for a specific loan
    pub fn get_loan_transactions(env: Env, loan_id: u32) -> Vec<Transaction> {
        let transaction_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllTransactionIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut loan_transactions = Vec::new(&env);
        
        for tx_id in transaction_ids.iter() {
            if let Some(transaction) = env.storage().persistent().get::<DataKey, Transaction>(&DataKey::Transaction(tx_id)) {
                if transaction.loan_id == loan_id {
                    loan_transactions.push_back(transaction);
                }
            }
        }
        
        loan_transactions
    }
    
    /// Gets transactions for a specific borrower
    pub fn get_borrower_transactions(env: Env, borrower: Address) -> Vec<Transaction> {
        let transaction_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllTransactionIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut borrower_transactions = Vec::new(&env);
        
        for tx_id in transaction_ids.iter() {
            if let Some(transaction) = env.storage().persistent().get::<DataKey, Transaction>(&DataKey::Transaction(tx_id)) {
                if transaction.borrower == borrower {
                    borrower_transactions.push_back(transaction);
                }
            }
        }
        
        borrower_transactions
    }
    
    /// Gets loan summary statistics
    pub fn get_loan_summary(env: Env) -> LoanSummary {
        let loan_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllLoanIds)
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut total_loans = 0u32;
        let mut total_amount = 0i128;
        let mut pending_loans = 0u32;
        let mut approved_loans = 0u32;
        let mut repaid_loans = 0u32;
        let mut defaulted_loans = 0u32;
        let mut total_outstanding = 0i128;
        
        for loan_id in loan_ids.iter() {
            if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&DataKey::Loan(loan_id)) {
                total_loans += 1;
                total_amount += loan.amount;
                
                match loan.status {
                    LoanStatus::Pending => pending_loans += 1,
                    LoanStatus::Approved => {
                        approved_loans += 1;
                        total_outstanding += loan.amount - loan.repaid_amount;
                    },
                    LoanStatus::Repaid => repaid_loans += 1,
                    LoanStatus::Defaulted => defaulted_loans += 1,
                }
            }
        }
        
        LoanSummary {
            total_loans,
            total_amount,
            pending_loans,
            approved_loans,
            repaid_loans,
            defaulted_loans,
            total_outstanding,
        }
    }
    
    /// Calculates maximum loan amount based on risk tier
    pub fn get_max_loan_percentage(_env: Env, risk_tier: u32) -> u32 {
        match risk_tier {
            1 => 80, // 80% of salary stream
            2 => 65, // 65% of salary stream
            3 => 50, // 50% of salary stream
            4 => 35, // 35% of salary stream
            5 => 25, // 25% of salary stream
            _ => panic!("Invalid risk tier"),
        }
    }
    
    /// Internal function to record transactions
    fn record_transaction(
        env: &Env,
        loan_id: u32,
        transaction_type: TransactionType,
        amount: i128,
        borrower: Address,
    ) {
        // Get next transaction ID
        let mut tx_counter: u32 = env.storage().persistent()
            .get(&DataKey::TransactionCounter)
            .unwrap_or(0);
        tx_counter += 1;
        
        // Create transaction
        let transaction = Transaction {
            id: tx_counter,
            loan_id,
            transaction_type,
            amount,
            timestamp: env.ledger().timestamp(),
            borrower,
        };
        
        // Store transaction
        env.storage().persistent().set(&DataKey::Transaction(tx_counter), &transaction);
        env.storage().persistent().set(&DataKey::TransactionCounter, &tx_counter);
        
        // Add to all transactions list
        let mut all_transactions: Vec<u32> = env.storage().persistent()
            .get(&DataKey::AllTransactionIds)
            .unwrap_or_else(|| Vec::new(env));
        all_transactions.push_back(tx_counter);
        env.storage().persistent().set(&DataKey::AllTransactionIds, &all_transactions);
    }
}

mod test;