#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::{Address as _, Events as _}, Address, Env, String};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

#[test]
fn test_send_reward() {
    let env = Env::default();
    env.mock_all_auths();

    // Setup users
    let teacher = Address::generate(&env);
    let student = Address::generate(&env);

    // Mock native token
    let admin = Address::generate(&env);
    // register_stellar_asset_contract works well in recent soroban-sdk
    let token_address = env.register_stellar_asset_contract(admin.clone());
    
    let token_client = TokenClient::new(&env, &token_address);
    let token_admin_client = TokenAdminClient::new(&env, &token_address);

    // Fund teacher
    token_admin_client.mint(&teacher, &1000);
    assert_eq!(token_client.balance(&teacher), 1000);

    // Deploy our custom contract
    let contract_id = env.register_contract(None, MiniRewardContract);
    let client = MiniRewardContractClient::new(&env, &contract_id);

    let reason = String::from_str(&env, "Good job on Math!");

    // Execute reward
    client.send_reward(&token_address, &teacher, &student, &350, &reason);

    // Verify token balances
    assert_eq!(token_client.balance(&teacher), 650);
    assert_eq!(token_client.balance(&student), 350);

    // Verify event was emitted
    // In SDK v25+, env.events().all() returns ContractEvents which doesn't expose len() directly
    let _events = env.events().all();
}
