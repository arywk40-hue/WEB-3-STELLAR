#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub struct Donation {
    pub donor: Address,
    pub amount: i128,
    pub lat: i32,
    pub lon: i32,
    pub project_id: u32,
    pub timestamp: u64,
}

#[contracttype]
pub enum StorageKey {
    Admin,
    Count,
    Donation(i128),
}

#[contract]
pub struct GeoLedgerContract;

#[contractimpl]
impl GeoLedgerContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&StorageKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&StorageKey::Admin, &admin);
        env.storage().persistent().set(&StorageKey::Count, &0i128);
    }

    pub fn record_donation(
        env: Env,
        donor: Address,
        amount: i128,
        lat_i32: i32,
        lon_i32: i32,
        project_id: u32,
        timestamp: u64,
    ) {
        donor.require_auth();

        let mut count: i128 = env
            .storage()
            .persistent()
            .get(&StorageKey::Count)
            .unwrap_or(0);

        let donation = Donation {
            donor: donor.clone(),
            amount,
            lat: lat_i32,
            lon: lon_i32,
            project_id,
            timestamp,
        };

        env.storage()
            .persistent()
            .set(&StorageKey::Donation(count), &donation);

        count += 1;
        env.storage().persistent().set(&StorageKey::Count, &count);

        env.events().publish(
            (symbol_short!("donation"), symbol_short!("recorded")),
            (count - 1, donor, amount, lat_i32, lon_i32, project_id, timestamp),
        );
    }

    pub fn donation_count(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&StorageKey::Count)
            .unwrap_or(0)
    }

    pub fn get_donation_by_index(
        env: Env,
        index: i128,
    ) -> (Address, i128, i32, i32, u32, u64) {
        let donation: Donation = env
            .storage()
            .persistent()
            .get(&StorageKey::Donation(index))
            .expect("Donation not found");

        (
            donation.donor,
            donation.amount,
            donation.lat,
            donation.lon,
            donation.project_id,
            donation.timestamp,
        )
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&StorageKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        env.storage().instance().set(&StorageKey::Admin, &new_admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&StorageKey::Admin)
            .expect("Not initialized")
    }
}