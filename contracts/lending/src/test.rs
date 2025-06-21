#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_request_loan() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingContract);
    let client = LendingContractClient::new(&env, &contract_id);

    client.initialize();

    let borrower = Address::generate(&env);
    let amount = 1000i128;
    let risk_tier = 3u8;
    let stream_id = 1u32;

    env.mock_all_auths();

    let loan_id = client.request_loan(&borrower, &amount, &risk_tier, &stream_id);
    
    assert_eq!(loan_id, 1);
    
    let loan = client.get_loan(&loan_id);
    assert_eq!(loan.borrower, borrower);
    assert_eq!(loan.amount, amount);
    assert_eq!(loan.risk_tier, risk_tier);
    assert_eq!(loan.interest_rate, 500u32); // 5% for tier 3
    assert!(matches!(loan.status, LoanStatus::Pending));
}

#[test]
fn test_approve_and_repay_loan() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingContract);
    let client = LendingContractClient::new(&env, &contract_id);

    client.initialize();

    let borrower = Address::generate(&env);
    let admin = Address::generate(&env);

    env.mock_all_auths();

    let loan_id = client.request_loan(&borrower, &1000i128, &2u8, &1u32);
    
    // Approve loan
    client.approve_loan(&admin, &loan_id);
    let loan = client.get_loan(&loan_id);
    assert!(matches!(loan.status, LoanStatus::Approved));
    
    // Repay partial amount
    let payment = client.repay_loan(&borrower, &loan_id, &500i128);
    assert_eq!(payment, 500i128);
    
    let loan = client.get_loan(&loan_id);
    assert_eq!(loan.repaid_amount, 500i128);
    assert!(matches!(loan.status, LoanStatus::Approved)); // Still approved, not fully repaid
    
    // Repay remaining amount
    client.repay_loan(&borrower, &loan_id, &500i128);
    let loan = client.get_loan(&loan_id);
    assert!(matches!(loan.status, LoanStatus::Repaid));
}

#[test]
fn test_max_loan_percentage() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingContract);
    let client = LendingContractClient::new(&env, &contract_id);

    assert_eq!(client.get_max_loan_percentage(&1u8), 80u32);
    assert_eq!(client.get_max_loan_percentage(&3u8), 50u32);
    assert_eq!(client.get_max_loan_percentage(&5u8), 25u32);
}
