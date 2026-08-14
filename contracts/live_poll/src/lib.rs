//! Stellar Live Poll — Soroban smart contract
//!
//! A minimal, single-question decentralized voting contract.
//! One wallet = one vote. Admin can initialize and close the poll.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Vec,
};

/// Storage keys used by the contract.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Question,
    Options,
    VoteCounts,
    Active,
    Initialized,
    /// Per-voter flag. Kept in persistent storage so it survives
    /// independently of the poll's own instance TTL bumps.
    HasVoted(Address),
}

/// All errors the contract can return. The frontend maps each of these
/// to a friendly, human-readable message (see `frontend/src/lib/contract.ts`).
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    PollNotInitialized = 1,
    PollAlreadyInitialized = 2,
    PollClosed = 3,
    InvalidOption = 4,
    AlreadyVoted = 5,
    Unauthorized = 6,
}

const DAY_IN_LEDGERS: u32 = 17280; // ~1 ledger every 5s
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const VOTER_BUMP_AMOUNT: u32 = 60 * DAY_IN_LEDGERS;
const VOTER_LIFETIME_THRESHOLD: u32 = VOTER_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contract]
pub struct LivePollContract;

#[contractimpl]
impl LivePollContract {
    /// Initialize the poll. Can only be called once.
    /// `admin` must sign this call and becomes the only account allowed
    /// to close the poll later.
    pub fn initialize(
        env: Env,
        admin: Address,
        question: String,
        options: Vec<String>,
    ) -> Result<(), Error> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::PollAlreadyInitialized);
        }

        let mut counts: Vec<u32> = Vec::new(&env);
        for _ in 0..options.len() {
            counts.push_back(0);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Question, &question);
        env.storage().instance().set(&DataKey::Options, &options);
        env.storage().instance().set(&DataKey::VoteCounts, &counts);
        env.storage().instance().set(&DataKey::Active, &true);
        env.storage().instance().set(&DataKey::Initialized, &true);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        Ok(())
    }

    /// Cast a vote for `option` (a zero-based index into the poll's options).
    /// `voter` must sign this call. Emits a `VoteCast` event on success.
    pub fn vote(env: Env, voter: Address, option: u32) -> Result<(), Error> {
        voter.require_auth();

        Self::require_initialized(&env)?;

        let active: bool = env.storage().instance().get(&DataKey::Active).unwrap();
        if !active {
            return Err(Error::PollClosed);
        }

        let options: Vec<String> = env.storage().instance().get(&DataKey::Options).unwrap();
        if option >= options.len() {
            return Err(Error::InvalidOption);
        }

        let voted_key = DataKey::HasVoted(voter.clone());
        if env.storage().persistent().has(&voted_key) {
            return Err(Error::AlreadyVoted);
        }

        let mut counts: Vec<u32> = env.storage().instance().get(&DataKey::VoteCounts).unwrap();
        let current = counts.get(option).unwrap();
        counts.set(option, current + 1);
        env.storage().instance().set(&DataKey::VoteCounts, &counts);

        env.storage().persistent().set(&voted_key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&voted_key, VOTER_LIFETIME_THRESHOLD, VOTER_BUMP_AMOUNT);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // VoteCast { voter, option } — topics: ("VoteCast", voter), data: option
        env.events()
            .publish((symbol_short!("VoteCast"), voter), option);

        Ok(())
    }

    /// Return the vote count for every option, in option order.
    pub fn get_results(env: Env) -> Result<Vec<u32>, Error> {
        Self::require_initialized(&env)?;
        Ok(env.storage().instance().get(&DataKey::VoteCounts).unwrap())
    }

    /// Return the vote count for a single option.
    pub fn get_vote_count(env: Env, option: u32) -> Result<u32, Error> {
        let counts = Self::get_results(env)?;
        counts.get(option).ok_or(Error::InvalidOption)
    }

    /// Check whether `voter` has already voted.
    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage().persistent().has(&DataKey::HasVoted(voter))
    }

    /// Return (question, options, active).
    pub fn get_poll(env: Env) -> Result<(String, Vec<String>, bool), Error> {
        Self::require_initialized(&env)?;
        let question: String = env.storage().instance().get(&DataKey::Question).unwrap();
        let options: Vec<String> = env.storage().instance().get(&DataKey::Options).unwrap();
        let active: bool = env.storage().instance().get(&DataKey::Active).unwrap();
        Ok((question, options, active))
    }

    /// Close the poll. Only the admin set at `initialize` may call this.
    /// Voting stops; existing results remain readable via `get_results`.
    pub fn close_poll(env: Env, admin: Address) -> Result<(), Error> {
        admin.require_auth();
        Self::require_initialized(&env)?;

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if stored_admin != admin {
            return Err(Error::Unauthorized);
        }

        env.storage().instance().set(&DataKey::Active, &false);
        Ok(())
    }

    fn require_initialized(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::PollNotInitialized);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    
    use super::*;
    use soroban_sdk::testutils::Events;
    use soroban_sdk::{testutils::Address as _, vec, Env, String};

    fn setup(env: &Env) -> (LivePollContractClient, Address) {
        let contract_id = env.register(LivePollContract, ());
        let client = LivePollContractClient::new(env, &contract_id);
        let admin = Address::generate(env);
        (client, admin)
    }

    fn options(env: &Env) -> Vec<String> {
        vec![
            env,
            String::from_str(env, "C++"),
            String::from_str(env, "Python"),
            String::from_str(env, "JavaScript"),
        ]
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        let question = String::from_str(&env, "Which programming language do you prefer?");

        client.initialize(&admin, &question, &options(&env));

        let (q, opts, active) = client.get_poll();
        assert_eq!(q, question);
        assert_eq!(opts.len(), 3);
        assert!(active);
        assert_eq!(client.get_results(), vec![&env, 0, 0, 0]);
    }

    #[test]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        let question = String::from_str(&env, "Q?");

        client.initialize(&admin, &question, &options(&env));
        let result = client.try_initialize(&admin, &question, &options(&env));
        assert_eq!(result, Err(Ok(Error::PollAlreadyInitialized)));
    }

    #[test]
    fn test_valid_vote() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter = Address::generate(&env);
        client.vote(&voter, &1u32);

        assert_eq!(client.get_vote_count(&1u32), 1);
        assert_eq!(client.get_results(), vec![&env, 0, 1, 0]);
        assert!(client.has_voted(&voter));
    }

    #[test]
    fn test_invalid_option_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter = Address::generate(&env);
        let result = client.try_vote(&voter, &99u32);
        assert_eq!(result, Err(Ok(Error::InvalidOption)));
    }

    #[test]
    fn test_double_vote_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter = Address::generate(&env);
        client.vote(&voter, &0u32);
        let result = client.try_vote(&voter, &1u32);
        assert_eq!(result, Err(Ok(Error::AlreadyVoted)));
        // The original vote must be unaffected.
        assert_eq!(client.get_results(), vec![&env, 1, 0, 0]);
    }

    #[test]
    fn test_vote_after_close_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        client.close_poll(&admin);
        let (_, _, active) = client.get_poll();
        assert!(!active);

        let voter = Address::generate(&env);
        let result = client.try_vote(&voter, &0u32);
        assert_eq!(result, Err(Ok(Error::PollClosed)));
    }

    #[test]
    fn test_unauthorized_close_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let not_admin = Address::generate(&env);
        let result = client.try_close_poll(&not_admin);
        assert_eq!(result, Err(Ok(Error::Unauthorized)));
    }

    #[test]
    fn test_different_wallets_voting() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter_a = Address::generate(&env);
        let voter_b = Address::generate(&env);
        let voter_c = Address::generate(&env);

        client.vote(&voter_a, &0u32);
        client.vote(&voter_b, &0u32);
        client.vote(&voter_c, &2u32);

        assert_eq!(client.get_results(), vec![&env, 2, 0, 1]);
        assert!(client.has_voted(&voter_a));
        assert!(client.has_voted(&voter_b));
        assert!(client.has_voted(&voter_c));
    }

    #[test]
    fn test_has_voted_false_before_voting() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter = Address::generate(&env);
        assert!(!client.has_voted(&voter));
    }

    #[test]
    fn test_actions_before_initialize_fail() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _admin) = setup(&env);

        let voter = Address::generate(&env);
        assert_eq!(client.try_vote(&voter, &0u32), Err(Ok(Error::PollNotInitialized)));
        assert_eq!(client.try_get_results(), Err(Ok(Error::PollNotInitialized)));
        assert_eq!(client.try_get_poll(), Err(Ok(Error::PollNotInitialized)));
    }

    #[test]
    fn test_vote_cast_event_emitted() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);
        client.initialize(&admin, &String::from_str(&env, "Q?"), &options(&env));

        let voter = Address::generate(&env);
        client.vote(&voter, &2u32);

        let events = env.events().all();
        // At least one event was published for this vote call.
        assert!(!events.is_empty());
    }
}
