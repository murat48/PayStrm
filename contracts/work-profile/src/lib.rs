#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env};

#[derive(Clone)]
#[contracttype]
pub struct WorkProfile {
    pub employee: Address,
    pub years_experience: u32,
    pub current_job_duration: u32, // months
    pub job_changes: u32,
    pub sector: Bytes,
    pub risk_score: u32,
    pub risk_tier: u32,
    pub updated_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Profile(Address),
}

#[contract]
pub struct WorkProfileContract;

#[contractimpl]
impl WorkProfileContract {
    /// Updates work profile for an employee
    pub fn update_profile(
        env: Env,
        employee: Address,
        years_experience: u32,
        current_job_duration: u32,
        job_changes: u32,
        sector: Bytes,
    ) {
        // Require authorization from employee
        employee.require_auth();
        
        // Calculate risk score
        let risk_score = Self::calculate_risk_score(years_experience, current_job_duration, job_changes);
        let risk_tier = Self::get_risk_tier(risk_score);
        
        let profile = WorkProfile {
            employee: employee.clone(),
            years_experience,
            current_job_duration,
            job_changes,
            sector,
            risk_score,
            risk_tier,
            updated_at: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Profile(employee), &profile);
    }
    
    /// Gets work profile for an employee
    pub fn get_profile(env: Env, employee: Address) -> Option<WorkProfile> {
        env.storage().persistent().get(&DataKey::Profile(employee))
    }
    
    /// Calculates risk score based on work history
    pub    fn calculate_risk_score(
        years_experience: u32,
        current_job_duration: u32,
        job_changes: u32,
    ) -> u32 {
        let mut score = 50u32; // Base score
        
        // Years of experience (0-40 points)
        if years_experience >= 8 {
            score = score.saturating_add(40);
        } else if years_experience >= 5 {
            score = score.saturating_add(30);
        } else if years_experience >= 3 {
            score = score.saturating_add(20);
        } else if years_experience >= 1 {
            score = score.saturating_add(10);
        }
        
        // Current job duration (0-30 points)
        if current_job_duration >= 24 {
            score = score.saturating_add(30);
        } else if current_job_duration >= 12 {
            score = score.saturating_add(20);
        } else if current_job_duration >= 6 {
            score = score.saturating_add(10);
        }
        
        // Job changes penalty/bonus (0-20 points)
        if job_changes <= 1 {
            score = score.saturating_add(20);
        } else if job_changes <= 2 {
            score = score.saturating_add(10);
        } else if job_changes <= 3 {
            score = score.saturating_add(5);
        } else {
            // Penalty for frequent job changes
            let penalty = (job_changes - 3) * 5;
            score = score.saturating_sub(penalty);
        }
        
        // Ensure score is between 0 and 100
        if score > 100 {
            100
        } else {
            score
        }
    }
    
    /// Gets risk tier based on score
    pub fn get_risk_tier(risk_score: u32) -> u32 {
        if risk_score >= 80 {
            1 // Excellent
        } else if risk_score >= 65 {
            2 // Good
        } else if risk_score >= 50 {
            3 // Fair
        } else if risk_score >= 35 {
            4 // Poor
        } else {
            5 // High Risk
        }
    }
    
    /// Gets risk tier directly for an employee
    pub fn get_employee_risk_tier(env: Env, employee: Address) -> u32 {
        match Self::get_profile(env, employee) {
            Some(profile) => profile.risk_tier,
            None => 5, // Default to highest risk if no profile
        }
    }
    
    /// Checks if employee has a complete profile
    pub fn has_profile(env: Env, employee: Address) -> bool {
        env.storage().persistent().has(&DataKey::Profile(employee))
    }
}

mod test;
