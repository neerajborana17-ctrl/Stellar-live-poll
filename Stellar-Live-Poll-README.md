# Stellar Live Poll

A decentralized, single-question live-voting dApp built on **Stellar
Soroban**. Users connect a Stellar wallet, vote once, and see on-chain
results and live activity updates without a backend database.

## Project Status

**Deployed and verified on Stellar Testnet.**

-   Smart contract: deployed to Stellar Testnet
-   Contract ID:
    `CD3D0N2F306U7PE7E3PFMUQDBFHSI35ZUBYAVMVSQ5S5CZXVNQVQ7QZ6`
-   Smart contract: Rust + Soroban SDK
-   Frontend: React + TypeScript + Vite
-   Contract tests: **11 passed, 0 failed**
-   Frontend production build: **successful**
-   Wallet integration: StellarWalletsKit / Freighter-compatible wallet
    flow
-   Real Testnet transaction proof: included below

> The contract ID above is the deployed Testnet contract used by this
> project. Do not replace it with a code hash.

## Features

-   Stellar Testnet + real Soroban smart contract
-   Multi-wallet support through StellarWalletsKit
-   Decentralized voting with results stored on-chain
-   One vote per wallet enforced by the smart contract
-   Admin-controlled poll initialization and closing
-   Real-time `VoteCast` event integration using Soroban RPC polling
-   Live vote results with exact counts
-   Live activity feed
-   Transaction status handling
-   Contract and wallet error handling
-   Stellar Explorer links for transaction and contract verification

## Tech Stack

  Layer            Technology
  ---------------- ---------------------------------------
  Smart Contract   Rust + Soroban SDK
  Blockchain       Stellar Testnet
  Frontend         React 18 + TypeScript + Vite
  Styling          Tailwind CSS
  Chain Access     `@stellar/stellar-sdk`
  Wallets          `@creit.tech/stellar-wallets-kit`
  Hosting          Vercel-compatible frontend deployment

## Architecture

``` text
Stellar Wallet
     |
     v
React + TypeScript Frontend
     |
     v
@stellar/stellar-sdk
(build / sign / submit)
     |
     v
Soroban Smart Contract
     |
     +----> On-chain vote counts
     |
     +----> VoteCast events
                  |
                  v
          Soroban RPC getEvents()
                  |
                  v
       Live Results + Activity Feed
```

## Project Structure

``` text
stellar-live-poll/
├── contracts/
│   └── live_poll/
│       ├── src/
│       │   └── lib.rs
│       ├── test_snapshots/
│       ├── Cargo.toml
│       └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
├── Cargo.toml
├── Cargo.lock
├── .env.example
└── README.md
```

## Smart Contract

The Soroban contract is located at:

``` text
contracts/live_poll/src/lib.rs
```

### Contract Functions

  Function                                 Purpose
  ---------------------------------------- ---------------------------------------------
  `initialize(admin, question, options)`   Initializes the poll once
  `vote(voter, option)`                    Casts a vote after authorization
  `get_results()`                          Returns vote counts
  `get_vote_count(option)`                 Returns the count for one option
  `has_voted(voter)`                       Checks whether a wallet has voted
  `get_poll()`                             Returns question, options, and active state
  `close_poll(admin)`                      Admin-only operation to close voting

### Contract Safety

The contract uses authorization checks and custom errors for invalid
operations, including:

-   Poll not initialized
-   Poll already initialized
-   Poll closed
-   Invalid option
-   Already voted
-   Unauthorized operation

Votes are enforced by the smart contract rather than only by frontend
logic.

## Deployment Information

### Network

**Stellar Testnet**

### Deployed Contract ID

``` text
CD3D0N2F306U7PE7E3PFMUQDBFHSI35ZUBYAVMVSQ5S5CZXVNQVQ7QZ6
```

### Contract Verification

``` text
https://stellar.expert/explorer/testnet/contract/CD3D0N2F306U7PE7E3PFMUQDBFHSI35ZUBYAVMVSQ5S5CZXVNQVQ7QZ6
```

## Transaction Proof

A real Testnet transaction was successfully submitted while initializing
the deployed poll contract.

### Initialization Transaction Hash

``` text
7c588e62c18fc14f5a78dcf599968a48371bab530051ae6849b288f16adb0c51
```

### Stellar Expert

``` text
https://stellar.expert/explorer/testnet/tx/7c588e62c18fc14f5a78dcf599968a48371bab530051ae6849b288f16adb0c51
```

The transaction was submitted successfully on Stellar Testnet.

> This is the initialization transaction proof. If a separate vote
> transaction is recorded later, it can be added as an additional proof.

## Environment Variables

Create the frontend environment file:

``` bash
cd frontend
cp .env.example .env
```

Configure:

``` env
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT_ID=CD3D0N2F306U7PE7E3PFMUQDBFHSI35ZUBYAVMVSQ5S5CZXVNQVQ7QZ6
VITE_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

Do **not** commit a real `.env` file containing secrets. Only public
configuration values should be tracked.

## Build and Test

### Frontend

``` bash
cd frontend
npm install
npm run build
```

The production build was successfully completed during project
verification.

### Smart Contract Tests

``` bash
cd contracts/live_poll
cargo test
```

Verified result:

``` text
test result: ok
11 passed; 0 failed
```

## Running Locally

``` bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

``` text
http://localhost:5173
```

Connect a supported Stellar wallet and interact with the deployed
Testnet contract.

## Real-Time Event Updates

Soroban RPC event updates are handled through polling with `getEvents()`
and a ledger cursor.

``` text
Vote transaction
      |
      v
Soroban contract emits VoteCast
      |
      v
Soroban RPC getEvents()
      |
      v
Frontend event polling hook
      |
      v
Activity feed + results update
```

This allows the UI to update without manually refreshing the page.

## Wallet Integration

The frontend uses StellarWalletsKit for wallet selection and connection.

``` text
Connect Wallet
      |
      v
Select Stellar wallet
      |
      v
Approve connection
      |
      v
Read wallet public address
      |
      v
Build contract transaction
      |
      v
Sign transaction
      |
      v
Submit to Stellar Testnet
      |
      v
Track transaction status
```

## Error Handling

The frontend handles common wallet and transaction errors, including:

-   Wallet not connected
-   Wallet unavailable
-   User rejected transaction
-   Invalid poll option
-   Already voted
-   Poll closed
-   Contract failure
-   Network/RPC failure
-   Insufficient balance
-   Transaction timeout

The contract also returns explicit custom errors instead of silently
accepting invalid operations.

## Level 2 Requirement Verification

  Requirement                                 Status
  ------------------------------------------- ----------------------------
  Project-specific Soroban smart contract     ✅ Complete
  Contract folder structure                   ✅ Complete
  Contract functions implemented              ✅ Complete
  Custom contract errors                      ✅ Complete
  `require_auth` authorization checks         ✅ Complete
  `VoteCast` events                           ✅ Complete
  Contract unit tests written                 ✅ Complete
  Contract unit tests passing                 ✅ **11 passed, 0 failed**
  Contract deployed to Stellar Testnet        ✅ Complete
  Real contract ID documented                 ✅ Complete
  Real Testnet transaction proof documented   ✅ Complete
  Frontend calls real contract                ✅ Complete
  StellarWalletsKit wallet integration        ✅ Complete
  Multi-wallet selection flow                 ✅ Complete
  Voting transaction flow                     ✅ Complete
  Transaction status handling                 ✅ Complete
  Stellar Explorer integration                ✅ Complete
  `VoteCast` event polling                    ✅ Complete
  Real-time results update                    ✅ Complete
  Live activity feed                          ✅ Complete
  Public GitHub repository                    ✅ Complete
  README documentation                        ✅ Complete
  No private secrets committed                ✅ Complete
  Frontend production build                   ✅ Successful

## Deployment Reproduction Steps

``` bash
# Build the contract
stellar contract build

# Run tests
cd contracts/live_poll
cargo test
cd ../..

# Deploy to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/live_poll.wasm \
  --source <FUNDED_TESTNET_IDENTITY> \
  --network testnet

# Initialize the deployed contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <FUNDED_TESTNET_IDENTITY> \
  --network testnet \
  -- \
  initialize \
  --admin <ADMIN_ADDRESS> \
  --question "Which blockchain platform do you prefer?" \
  --options '["Stellar","Ethereum","Solana"]'
```

## Security Notes

-   No private keys or wallet secret keys are stored in the repository.
-   Wallet signing is performed by the user's wallet.
-   The contract verifies authorization on-chain.
-   The frontend does not replace smart-contract authorization.
-   `.env` files containing local secrets remain ignored by Git.

## GitHub Repository

``` text
https://github.com/neerajborana17-ctrl/Stellar-live-poll
```

## Conclusion

Stellar Live Poll demonstrates a complete Soroban-based voting dApp
with:

-   A project-specific Rust smart contract
-   On-chain voting and vote counting
-   One-vote-per-wallet enforcement
-   Stellar wallet integration
-   Stellar Testnet deployment
-   Real Testnet transaction proof
-   Contract event handling
-   Live result updates
-   Activity feed
-   Contract tests
-   Production frontend build
-   Deployment and verification documentation
