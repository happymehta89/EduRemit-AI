#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let parent = Address::generate(&env);
    let student = Address::generate(&env);
    let university = Address::generate(&env);

    // Deploy a dummy token contract for testing
    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract_id.address();
    let token_client = token::StellarAssetClient::new(&env, &token_address);
    let token = token::Client::new(&env, &token_address);

    // Register our EduRemit contract
    let contract_id = env.register_contract(None, EduRemitContract);
    let client = EduRemitContractClient::new(&env, &contract_id);

    client.initialize(&token_address);

    // Link student
    client.link_student(&parent, &student, &1000i128);

    assert_eq!(client.get_student_parent(&student), Some(parent.clone()));
    assert_eq!(client.get_student_allowance(&student), 1000i128);
    assert_eq!(client.get_student_balance(&student), 0i128);

    // Mint tokens to parent
    token_client.mint(&parent, &2000i128);
    assert_eq!(token.balance(&parent), 2000i128);

    // Parent deposits 1500 tokens
    client.deposit(&parent, &student, &1500i128);
    assert_eq!(client.get_student_balance(&student), 1500i128);
    assert_eq!(token.balance(&parent), 500i128);

    // Student withdraws 400 tokens (within allowance of 1000)
    client.withdraw(&student, &400i128);
    assert_eq!(client.get_student_balance(&student), 1100i128);
    assert_eq!(token.balance(&student), 400i128);

    // Student pays tuition of 500 to university
    client.pay_university(&student, &university, &500i128);
    assert_eq!(client.get_student_balance(&student), 600i128);
    assert_eq!(token.balance(&university), 500i128);
}
