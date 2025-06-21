#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_create_stream() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let total_amount = 1000i128;
    let duration = 100u64;


    let stream_id = client.create_stream(&employer, &employee, &total_amount, &duration);
    
    assert_eq!(stream_id, 1);
    
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.employer, employer);
    assert_eq!(stream.employee, employee);
    assert_eq!(stream.total_amount, total_amount);
    assert_eq!(stream.duration_seconds, duration);
    assert_eq!(stream.rate_per_second, 10i128); // 1000 / 100
    assert!(stream.is_active);
    assert!(!stream.is_paused);
}

#[test]
fn test_withdraw() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let total_amount = 1000i128;
    let duration = 100u64;


    let stream_id = client.create_stream(&employer, &employee, &total_amount, &duration);
    
    // Fast forward time by 10 seconds
    env.ledger().with_mut(|li| li.timestamp = 10);
    
    let available = client.calculate_available(&stream_id);
    assert_eq!(available, 100i128); // 10 seconds * 10 per second
    
    let withdrawn = client.withdraw(&stream_id, &50i128);
    assert_eq!(withdrawn, 50i128);
    
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.withdrawn_amount, 50i128);
}

#[test]
fn test_pause_resume() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);


    let stream_id = client.create_stream(&employer, &employee, &1000i128, &100u64);
    
    client.pause_stream(&stream_id);
    let stream = client.get_stream(&stream_id);
    assert!(stream.is_paused);
    
    client.resume_stream(&stream_id);
    let stream = client.get_stream(&stream_id);
    assert!(!stream.is_paused);
}

#[test]
fn test_register_employee() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let name = String::from_str(&env, "John Doe");
    let email = String::from_str(&env, "john@company.com");
    let phone = String::from_str(&env, "+90 555 123 4567");
    let position = String::from_str(&env, "Senior Developer");
    let department = String::from_str(&env, "Engineering");
    let start_date = 1640995200u64; // January 1, 2022


    // Register employee
    client.register_employee(&employer, &employee, &name, &email, &phone, &position, &department, &start_date);
    
    // Get employee info
    let employee_info = client.get_employee_info(&employee);
    assert_eq!(employee_info.address, employee);
    assert_eq!(employee_info.name, name);
    assert_eq!(employee_info.email, email);
    assert_eq!(employee_info.phone, phone);
    assert_eq!(employee_info.position, position);
    assert_eq!(employee_info.department, department);
    assert_eq!(employee_info.start_date, start_date);
    assert_eq!(employee_info.employer, employer);
    assert!(employee_info.is_active);
    assert!(employee_info.end_date.is_none());
}

#[test]
fn test_update_employee_info() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let initial_name = String::from_str(&env, "John Doe");
    let initial_email = String::from_str(&env, "john@company.com");
    let initial_phone = String::from_str(&env, "+90 555 123 4567");
    let initial_position = String::from_str(&env, "Junior Developer");
    let initial_department = String::from_str(&env, "Engineering");
    let start_date = 1640995200u64;
    
    let updated_name = String::from_str(&env, "John Smith");
    let updated_email = String::from_str(&env, "johnsmith@company.com");
    let updated_phone = String::from_str(&env, "+90 555 987 6543");
    let updated_position = String::from_str(&env, "Senior Developer");
    let updated_department = String::from_str(&env, "Engineering");


    // Register employee
    client.register_employee(&employer, &employee, &initial_name, &initial_email, &initial_phone, &initial_position, &initial_department, &start_date);
    
    // Update employee info
    client.update_employee_info(&employer, &employee, &updated_name, &updated_email, &updated_phone, &updated_position, &updated_department);
    
    // Verify updates
    let employee_info = client.get_employee_info(&employee);
    assert_eq!(employee_info.name, updated_name);
    assert_eq!(employee_info.email, updated_email);
    assert_eq!(employee_info.phone, updated_phone);
    assert_eq!(employee_info.position, updated_position);
    assert_eq!(employee_info.department, updated_department);
}

#[test]
fn test_get_employer_employees() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee1 = Address::generate(&env);
    let employee2 = Address::generate(&env);
    
    let name1 = String::from_str(&env, "Alice");
    let email1 = String::from_str(&env, "alice@company.com");
    let phone1 = String::from_str(&env, "+90 555 111 1111");
    let position1 = String::from_str(&env, "Frontend Developer");
    let department1 = String::from_str(&env, "Engineering");
    let start_date1 = 1640995200u64;
    
    let name2 = String::from_str(&env, "Bob");
    let email2 = String::from_str(&env, "bob@company.com");
    let phone2 = String::from_str(&env, "+90 555 222 2222");
    let position2 = String::from_str(&env, "Backend Developer");
    let department2 = String::from_str(&env, "Engineering");
    let start_date2 = 1641081600u64;


    // Register employees
    client.register_employee(&employer, &employee1, &name1, &email1, &phone1, &position1, &department1, &start_date1);
    client.register_employee(&employer, &employee2, &name2, &email2, &phone2, &position2, &department2, &start_date2);
    
    // Get all employees for employer
    let employees = client.get_employer_employees(&employer);
    assert_eq!(employees.len(), 2);
    
    // Verify employee data
    let emp1 = employees.get(0).unwrap();
    let emp2 = employees.get(1).unwrap();
    
    assert_eq!(emp1.name, name1);
    assert_eq!(emp1.email, email1);
    assert_eq!(emp1.position, position1);
    assert_eq!(emp1.department, department1);
    assert_eq!(emp2.name, name2);
    assert_eq!(emp2.email, email2);
    assert_eq!(emp2.position, position2);
    assert_eq!(emp2.department, department2);
}

#[test]
fn test_deactivate_employee() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let name = String::from_str(&env, "John Doe");
    let email = String::from_str(&env, "john@company.com");
    let phone = String::from_str(&env, "+90 555 123 4567");
    let position = String::from_str(&env, "Developer");
    let department = String::from_str(&env, "Engineering");
    let start_date = 1640995200u64;


    // Register employee
    client.register_employee(&employer, &employee, &name, &email, &phone, &position, &department, &start_date);
    
    // Verify employee is active
    let employee_info = client.get_employee_info(&employee);
    assert!(employee_info.is_active);
    assert!(employee_info.end_date.is_none());
    
    // Deactivate employee
    client.deactivate_employee(&employer, &employee);
    
    // Verify deactivation and end date is set
    let employee_info = client.get_employee_info(&employee);
    assert!(!employee_info.is_active);
    assert!(employee_info.end_date.is_some());
}

#[test]
fn test_reactivate_employee() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let name = String::from_str(&env, "John Doe");
    let email = String::from_str(&env, "john@company.com");
    let phone = String::from_str(&env, "+90 555 123 4567");
    let position = String::from_str(&env, "Developer");
    let department = String::from_str(&env, "Engineering");
    let start_date = 1640995200u64;


    // Register employee
    client.register_employee(&employer, &employee, &name, &email, &phone, &position, &department, &start_date);
    
    // Deactivate employee
    client.deactivate_employee(&employer, &employee);
    let employee_info = client.get_employee_info(&employee);
    assert!(!employee_info.is_active);
    assert!(employee_info.end_date.is_some());
    
    // Reactivate employee
    client.reactivate_employee(&employer, &employee);
    
    // Verify reactivation
    let employee_info = client.get_employee_info(&employee);
    assert!(employee_info.is_active);
    assert!(employee_info.end_date.is_none());
}

#[test]
fn test_update_employee_position() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SalaryStreamingContract);
    let client = SalaryStreamingContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let employee = Address::generate(&env);
    let name = String::from_str(&env, "John Doe");
    let email = String::from_str(&env, "john@company.com");
    let phone = String::from_str(&env, "+90 555 123 4567");
    let initial_position = String::from_str(&env, "Junior Developer");
    let initial_department = String::from_str(&env, "Engineering");
    let new_position = String::from_str(&env, "Senior Developer");
    let new_department = String::from_str(&env, "Engineering");
    let start_date = 1640995200u64;


    // Register employee
    client.register_employee(&employer, &employee, &name, &email, &phone, &initial_position, &initial_department, &start_date);
    
    // Update position
    client.update_employee_position(&employer, &employee, &new_position, &new_department);
    
    // Verify position update
    let employee_info = client.get_employee_info(&employee);
    assert_eq!(employee_info.position, new_position);
    assert_eq!(employee_info.department, new_department);
    // Verify other fields remain unchanged
    assert_eq!(employee_info.name, name);
    assert_eq!(employee_info.email, email);
    assert_eq!(employee_info.phone, phone);
}
