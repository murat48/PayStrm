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
pub enum DataKey {
    LoanCounter,
    Loan(u32),
    BorrowerLoans(Address),
    RiskMultiplier(u32),
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
    }
    
    /// Requests a loan using salary stream as collateral
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
        
        // Get interest rate for risk tier
        let interest_rate: u32 = env.storage().persistent()
            .get(&DataKey::RiskMultiplier(risk_tier))
            .unwrap_or(600u32);
        
        // Get next loan ID
        let mut counter: u32 = env.storage().persistent().get(&DataKey::LoanCounter).unwrap_or(0);
        counter += 1;
        
        // Create loan
        let loan = Loan {
            id: counter,
            borrower: borrower.clone(),
            amount,
            status: LoanStatus::Pending,
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
        env.storage().persistent().set(&DataKey::BorrowerLoans(borrower), &borrower_loans);
        
        counter
    }
    
    /// Approves a pending loan (admin function)
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
        
        loan.status = LoanStatus::Approved;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
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
        
        payment
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
}

mod test;
