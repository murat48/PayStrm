#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, Bytes};

#[test]
fn test_calculate_risk_score() {
    // High experience, stable job, few changes
    let score = WorkProfileContract::calculate_risk_score(10, 36, 1);
    assert!(score >= 80); // Should be tier 1
    
    // Medium experience, moderate stability
    let score = WorkProfileContract::calculate_risk_score(5, 12, 2);
    assert!(score >= 65 && score < 80); // Should be tier 2
    
    // Low experience, short tenure, many changes
    let score = WorkProfileContract::calculate_risk_score(1, 3, 5);
    assert!(score < 50); // Should be tier 4 or 5
}

#[test]
fn test_update_profile() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WorkProfileContract);
    let client = WorkProfileContractClient::new(&env, &contract_id);

    let employee = Address::generate(&env);
    let sector = Bytes::from_slice(&env, b"Technology");

    env.mock_all_auths();

    client.update_profile(&employee, &5u8, &18u8, &2u8, &sector);
    
    let profile = client.get_profile(&employee).unwrap();
    assert_eq!(profile.employee, employee);
    assert_eq!(profile.years_experience, 5);
    assert_eq!(profile.current_job_duration, 18);
    assert_eq!(profile.job_changes, 2);
    assert_eq!(profile.sector, sector);
    assert!(profile.risk_score > 0);
    assert!(profile.risk_tier >= 1 && profile.risk_tier <= 5);
}

#[test]
fn test_risk_tiers() {
    assert_eq!(WorkProfileContract::get_risk_tier(90), 1);
    assert_eq!(WorkProfileContract::get_risk_tier(70), 2);
    assert_eq!(WorkProfileContract::get_risk_tier(55), 3);
    assert_eq!(WorkProfileContract::get_risk_tier(40), 4);
    assert_eq!(WorkProfileContract::get_risk_tier(20), 5);
}

#[test]
fn test_has_profile() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WorkProfileContract);
    let client = WorkProfileContractClient::new(&env, &contract_id);

    let employee = Address::generate(&env);
    
    // Initially no profile
    assert!(!client.has_profile(&employee));
    
    env.mock_all_auths();
    
    // Create profile
    let sector = Bytes::from_slice(&env, b"Finance");
    client.update_profile(&employee, &3u8, &6u8, &1u8, &sector);
    
    // Now has profile
    assert!(client.has_profile(&employee));
    
    // Check risk tier
    let tier = client.get_employee_risk_tier(&employee);
    assert!(tier >= 1 && tier <= 5);
}
