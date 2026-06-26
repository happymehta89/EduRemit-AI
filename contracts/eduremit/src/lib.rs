#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    Balance(Address),
    Allowance(Address),
    Parent(Address),
}

#[contract]
pub struct EduRemitContract;

#[contractimpl]
impl EduRemitContract {
    // Initialize with the token contract (e.g., native XLM)
    pub fn initialize(env: Env, token: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    // Link a student to a parent and set an allowance
    pub fn link_student(env: Env, parent: Address, student: Address, allowance: i128) {
        parent.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Parent(student.clone()), &parent);
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(student.clone()), &allowance);
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Balance(student.clone()))
        {
            env.storage()
                .persistent()
                .set(&DataKey::Balance(student.clone()), &0i128);
        }
    }

    // Deposit funds for a student
    pub fn deposit(env: Env, parent: Address, student: Address, amount: i128) {
        parent.require_auth();

        // Verify parent is linked
        let linked_parent: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Parent(student.clone()))
            .expect("Student not linked to a parent");
        if linked_parent != parent {
            panic!("not the authorized parent");
        }

        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer funds from parent to contract
        token_client.transfer(&parent, &env.current_contract_address(), &amount);

        // Update balance
        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(student.clone()))
            .unwrap_or(0);
        balance += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(student.clone()), &balance);
    }

    // Withdraw funds (called by student)
    pub fn withdraw(env: Env, student: Address, amount: i128) {
        student.require_auth();

        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(student.clone()))
            .expect("No balance for student");
        let allowance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Allowance(student.clone()))
            .unwrap_or(0);

        if amount > balance {
            panic!("insufficient balance");
        }
        if amount > allowance {
            panic!("exceeds allowance");
        }

        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer from contract to student
        token_client.transfer(&env.current_contract_address(), &student, &amount);

        // Update balance
        balance -= amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(student.clone()), &balance);
    }

    // Pay university tuition directly
    pub fn pay_university(env: Env, student: Address, university: Address, amount: i128) {
        student.require_auth();

        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(student.clone()))
            .expect("No balance for student");
        let allowance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Allowance(student.clone()))
            .unwrap_or(0);

        if amount > balance {
            panic!("insufficient balance");
        }
        if amount > allowance {
            panic!("exceeds allowance");
        }

        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer from contract to university
        token_client.transfer(&env.current_contract_address(), &university, &amount);

        // Update balance
        balance -= amount;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(student.clone()), &balance);
    }

    pub fn get_student_balance(env: Env, student: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(student))
            .unwrap_or(0)
    }

    pub fn get_student_allowance(env: Env, student: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(student))
            .unwrap_or(0)
    }

    pub fn get_student_parent(env: Env, student: Address) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Parent(student))
    }
}

#[cfg(test)]
mod test;
