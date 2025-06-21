#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, String};

#[derive(Clone)]
#[contracttype]
pub struct SalaryStream {
    pub id: u32,
    pub employer: Address,
    pub employee: Address,
    pub total_amount: i128,
    pub rate_per_second: i128,
    pub start_time: u64,
    pub duration_seconds: u64,
    pub withdrawn_amount: i128,
    pub is_active: bool,
    pub is_paused: bool,
}

// Employee information structure
#[derive(Clone)]
#[contracttype]
pub struct EmployeeInfo {
    pub address: Address,
    pub name: String,
    pub email: String,
    pub phone: String,  // Phone number field
    pub position: String,  // Job position/title
    pub department: String,  // Department name
    pub employer: Address,
    pub registration_time: u64,
    pub start_date: u64,  // When employee started working
    pub end_date: Option<u64>,  // When employee left (None if still active)
    pub is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    StreamCounter,
    Stream(u32),
    EmployeeStreams(Address),
    EmployerStreams(Address),
    // Employee data storage keys
    EmployeeInfo(Address),
    EmployerEmployees(Address), // List of employee addresses for an employer
}

#[contract]
pub struct SalaryStreamingContract;

#[contractimpl]
impl SalaryStreamingContract {
    /// Register a new employee with name, email and phone
    pub fn register_employee(
        env: Env,
        employer: Address,
        employee: Address,
        name: String,
        email: String,
        phone: String,
        position: String,
        department: String,
        start_date: u64,
    ) {
        // Require authorization from employer
        employer.require_auth();
        
        // Create employee info
        let employee_info = EmployeeInfo {
            address: employee.clone(),
            name,
            email,
            phone,
            position,
            department,
            employer: employer.clone(),
            registration_time: env.ledger().timestamp(),
            start_date,
            end_date: None,  // No end date when registering
            is_active: true,
        };
        
        // Store employee info
        env.storage().persistent().set(&DataKey::EmployeeInfo(employee.clone()), &employee_info);
        
        // Add to employer's employee list
        let mut employer_employees: Vec<Address> = env.storage().persistent()
            .get(&DataKey::EmployerEmployees(employer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        
        // Check if employee already exists in the list
        if !employer_employees.iter().any(|addr| addr == employee) {
            employer_employees.push_back(employee);
            env.storage().persistent().set(&DataKey::EmployerEmployees(employer), &employer_employees);
        }
    }
    
    /// Get employee information
    pub fn get_employee_info(env: Env, employee: Address) -> EmployeeInfo {
        env.storage().persistent()
            .get(&DataKey::EmployeeInfo(employee))
            .expect("Employee not found")
    }
    
    /// Update employee information (name, email and phone)
    pub fn update_employee_info(
        env: Env,
        employer: Address,
        employee: Address,
        name: String,
        email: String,
        phone: String,
        position: String,
        department: String,
    ) {
        // Require authorization from employer
        employer.require_auth();
        
        // Get existing employee info
        let mut employee_info: EmployeeInfo = env.storage().persistent()
            .get(&DataKey::EmployeeInfo(employee.clone()))
            .expect("Employee not found");
        
        // Verify employer ownership
        if employee_info.employer != employer {
            panic!("Not authorized to update this employee");
        }
        
        // Update information
        employee_info.name = name;
        employee_info.email = email;
        employee_info.phone = phone;
        employee_info.position = position;
        employee_info.department = department;
        
        // Store updated info
        env.storage().persistent().set(&DataKey::EmployeeInfo(employee), &employee_info);
    }
    
    /// Deactivate an employee (terminate employment)
    pub fn deactivate_employee(env: Env, employer: Address, employee: Address) {
        // Require authorization from employer
        employer.require_auth();
        
        // Get existing employee info
        let mut employee_info: EmployeeInfo = env.storage().persistent()
            .get(&DataKey::EmployeeInfo(employee.clone()))
            .expect("Employee not found");
        
        // Verify employer ownership
        if employee_info.employer != employer {
            panic!("Not authorized to deactivate this employee");
        }
        
        // Deactivate and set end date
        employee_info.is_active = false;
        employee_info.end_date = Some(env.ledger().timestamp());
        env.storage().persistent().set(&DataKey::EmployeeInfo(employee), &employee_info);
    }
    
    /// Reactivate an employee (rehire)
    pub fn reactivate_employee(env: Env, employer: Address, employee: Address) {
        // Require authorization from employer
        employer.require_auth();
        
        // Get existing employee info
        let mut employee_info: EmployeeInfo = env.storage().persistent()
            .get(&DataKey::EmployeeInfo(employee.clone()))
            .expect("Employee not found");
        
        // Verify employer ownership
        if employee_info.employer != employer {
            panic!("Not authorized to reactivate this employee");
        }
        
        // Reactivate and clear end date
        employee_info.is_active = true;
        employee_info.end_date = None;
        env.storage().persistent().set(&DataKey::EmployeeInfo(employee), &employee_info);
    }

    /// Update employee position and department
    pub fn update_employee_position(
        env: Env,
        employer: Address,
        employee: Address,
        position: String,
        department: String,
    ) {
        // Require authorization from employer
        employer.require_auth();
        
        // Get existing employee info
        let mut employee_info: EmployeeInfo = env.storage().persistent()
            .get(&DataKey::EmployeeInfo(employee.clone()))
            .expect("Employee not found");
        
        // Verify employer ownership
        if employee_info.employer != employer {
            panic!("Not authorized to update this employee");
        }
        
        // Update position and department
        employee_info.position = position;
        employee_info.department = department;
        
        // Store updated info
        env.storage().persistent().set(&DataKey::EmployeeInfo(employee), &employee_info);
    }
    
    /// Get all employees for an employer
    pub fn get_employer_employees(env: Env, employer: Address) -> Vec<EmployeeInfo> {
        let employee_addresses: Vec<Address> = env.storage().persistent()
            .get(&DataKey::EmployerEmployees(employer))
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut employees = Vec::new(&env);
        for address in employee_addresses.iter() {
            if let Some(employee_info) = env.storage().persistent().get::<DataKey, EmployeeInfo>(&DataKey::EmployeeInfo(address.clone())) {
                employees.push_back(employee_info);
            }
        }
        
        employees
    }

    /// Creates a new salary stream
    pub fn create_stream(
        env: Env,
        employer: Address,
        employee: Address,
        total_amount: i128,
        duration_seconds: u64,
    ) -> u32 {
        // Require authorization from employer
        employer.require_auth();
        
        // Get next stream ID
        let mut counter: u32 = env.storage().persistent().get(&DataKey::StreamCounter).unwrap_or(0);
        counter += 1;
        
        // Calculate rate per second
        let rate_per_second = total_amount / (duration_seconds as i128);
        
        // Create stream
        let stream = SalaryStream {
            id: counter,
            employer: employer.clone(),
            employee: employee.clone(),
            total_amount,
            rate_per_second,
            start_time: env.ledger().timestamp(),
            duration_seconds,
            withdrawn_amount: 0,
            is_active: true,
            is_paused: false,
        };
        
        // Store stream
        env.storage().persistent().set(&DataKey::Stream(counter), &stream);
        env.storage().persistent().set(&DataKey::StreamCounter, &counter);
        
        // Add to employee and employer stream lists
        let mut employee_streams: Vec<u32> = env.storage().persistent()
            .get(&DataKey::EmployeeStreams(employee.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        employee_streams.push_back(counter);
        env.storage().persistent().set(&DataKey::EmployeeStreams(employee), &employee_streams);
        
        let mut employer_streams: Vec<u32> = env.storage().persistent()
            .get(&DataKey::EmployerStreams(employer.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        employer_streams.push_back(counter);
        env.storage().persistent().set(&DataKey::EmployerStreams(employer), &employer_streams);
        
        counter
    }
    
    /// Pauses an active stream
    pub fn pause_stream(env: Env, stream_id: u32) {
        let mut stream: SalaryStream = env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found");
        
        // Require authorization from employer
        stream.employer.require_auth();
        
        stream.is_paused = true;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
    }
    
    /// Resumes a paused stream
    pub fn resume_stream(env: Env, stream_id: u32) {
        let mut stream: SalaryStream = env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found");
        
        // Require authorization from employer
        stream.employer.require_auth();
        
        stream.is_paused = false;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
    }
    
    /// Ends a stream
    pub fn end_stream(env: Env, stream_id: u32) {
        let mut stream: SalaryStream = env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found");
        
        // Require authorization from employer
        stream.employer.require_auth();
        
        stream.is_active = false;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
    }
    
    /// Calculates available balance for withdrawal
    pub fn calculate_available(env: Env, stream_id: u32) -> i128 {
        let stream: SalaryStream = env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found");
        
        if !stream.is_active || stream.is_paused {
            return 0;
        }
        
        let current_time = env.ledger().timestamp();
        let elapsed_seconds = current_time.saturating_sub(stream.start_time);
        
        // Calculate total earned so far
        let total_earned = stream.rate_per_second * (elapsed_seconds as i128);
        
        // Cap at total amount
        let total_earned = if total_earned > stream.total_amount {
            stream.total_amount
        } else {
            total_earned
        };
        
        // Return available amount (earned - withdrawn)
        total_earned.saturating_sub(stream.withdrawn_amount)
    }
    
    /// Allows employee to withdraw earned funds
    pub fn withdraw(env: Env, stream_id: u32, amount: i128) -> i128 {
        let mut stream: SalaryStream = env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found");
        
        // Require authorization from employee
        stream.employee.require_auth();
        
        let available = Self::calculate_available(env.clone(), stream_id);
        
        // Check if requested amount is available
        if amount > available {
            panic!("Insufficient available balance");
        }
        
        // Update withdrawn amount
        stream.withdrawn_amount += amount;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        
        amount
    }
    
    /// Gets stream details
    pub fn get_stream(env: Env, stream_id: u32) -> SalaryStream {
        env.storage().persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream not found")
    }
    
    /// Gets all streams for an employee
    pub fn get_employee_streams(env: Env, employee: Address) -> Vec<SalaryStream> {
        let stream_ids: Vec<u32> = env.storage().persistent()
            .get(&DataKey::EmployeeStreams(employee))
            .unwrap_or_else(|| Vec::new(&env));
        
        let mut streams = Vec::new(&env);
        for stream_id in stream_ids.iter() {
            if let Some(stream) = env.storage().persistent().get::<DataKey, SalaryStream>(&DataKey::Stream(stream_id)) {
                streams.push_back(stream);
            }
        }
        
        streams
    }
    
    /// Gets all streams for an employer
    pub fn get_employer_streams(env: Env, employer: Address) -> Vec<u32> {
        env.storage().persistent()
            .get(&DataKey::EmployerStreams(employer))
            .unwrap_or_else(|| Vec::new(&env))
    }
    
    /// Gets all streams in the system (for viewing by any user)
    pub fn get_all_streams(env: Env) -> Vec<SalaryStream> {
        let counter: u32 = env.storage().persistent().get(&DataKey::StreamCounter).unwrap_or(0);
        
        let mut all_streams = Vec::new(&env);
        for stream_id in 1..=counter {
            if let Some(stream) = env.storage().persistent().get::<DataKey, SalaryStream>(&DataKey::Stream(stream_id)) {
                all_streams.push_back(stream);
            }
        }
        
        all_streams
    }
    
    /// Gets all stream IDs in the system
    pub fn get_all_stream_ids(env: Env) -> Vec<u32> {
        let counter: u32 = env.storage().persistent().get(&DataKey::StreamCounter).unwrap_or(0);
        
        let mut all_ids = Vec::new(&env);
        for stream_id in 1..=counter {
            if env.storage().persistent().has(&DataKey::Stream(stream_id)) {
                all_ids.push_back(stream_id);
            }
        }
        
        all_ids
    }
}

mod test;
