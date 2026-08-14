# Stellar Live Poll

A decentralized, single-question live-voting dApp built on **Stellar Soroban**.
Connect a Stellar wallet, vote once, and watch results and a live activity
feed update in real time as other people vote — no backend server, no
database, just a smart contract on Stellar Testnet.

> **Status:** contract code and frontend are complete and reviewed by hand.
> They have **not yet been built, tested, or deployed** in this environment
> because it has no network access (see "Manual Steps" below). Follow the
> commands in this README on your own machine to build, test, and deploy.

---

## Features

- Stellar Testnet + a real Soroban smart contract (`live_poll`)
- Multi-wallet support (Freighter and other Stellar wallets, via
  StellarWalletsKit)
- Decentralized voting — the vote and its tally live entirely on-chain
- One vote per wallet, enforced by the contract (not just the UI)
- Real-time `VoteCast` contract event integration (no page refresh)
- Live results with progress bars and exact vote counts
- Live activity feed of who voted for what
- Step-by-step transaction status (preparing → approval → submitted →
  pending → confirmed)
- Friendly error handling for wallet, user, and contract failures

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Rust + [`soroban-sdk`](https://docs.rs/soroban-sdk) |
| Network | Stellar Testnet |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Chain access | `@stellar/stellar-sdk` (Soroban RPC client) |
| Wallets | `@creit.tech/stellar-wallets-kit` (Freighter + others) |
| Hosting | Vercel (frontend only — the contract lives on Stellar Testnet) |

---

## Architecture

```text
Wallet (Freighter, etc.)
   ↓
React Frontend (Vite + TS)
   ↓
@stellar/stellar-sdk (build / sign / submit)
   ↓
Soroban Smart Contract (live_poll)
   ↓
VoteCast Event
   ↓
Stellar RPC getEvents() polling
   ↓
Live Results + Activity Feed (no page refresh)
```

---

## Project Structure

```text
stellar-live-poll/
├── contracts/
│   └── live_poll/
│       ├── src/lib.rs        # contract + unit tests
│       ├── Cargo.toml
│       └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, WalletConnect, PollCard, PollResults,
│   │   │                     # TransactionStatus, ActivityFeed, ErrorMessage,
│   │   │                     # PollStats, ContractInfo
│   │   ├── hooks/            # useWallet, usePoll, useEvents
│   │   ├── lib/               # stellar.ts (network/wallet config),
│   │   │                     # contract.ts (build/sign/submit + error mapping)
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── wallet-options.png    # add after running locally, see docs/README.md
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation

```bash
git clone <your-github-repository-url>
cd stellar-live-poll
cd frontend
npm install
```

> **MANUAL STEP REQUIRED** — `npm install` needs network access to
> npmjs.org and was not run in the environment that generated this
> project. Run it yourself before `npm run dev` / `npm run build`.

---

## Environment Variables

Copy the example file and fill in the values you get from deployment below:

```bash
cp .env.example frontend/.env
```

```env
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT_ID=      # filled in after you deploy the contract
VITE_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

Never commit a real `.env` file — it's already in `.gitignore`.

---

## Smart Contract

Contract: `contracts/live_poll` — see `contracts/live_poll/README.md` for the
full function/error reference. Summary:

| Function | Purpose |
|---|---|
| `initialize(admin, question, options)` | One-time poll setup |
| `vote(voter, option)` | Cast a vote; requires the voter's signature |
| `get_results()` | All vote counts, in option order |
| `get_vote_count(option)` | Vote count for one option |
| `has_voted(voter)` | Whether a wallet has already voted |
| `get_poll()` | `(question, options, active)` |
| `close_poll(admin)` | Admin-only; stops voting, keeps results visible |

Errors: `PollNotInitialized`, `PollAlreadyInitialized`, `PollClosed`,
`InvalidOption`, `AlreadyVoted`, `Unauthorized` — the contract returns these
instead of silently failing, and the frontend (`lib/contract.ts`) maps each
one to a plain-language message.

---

## Contract Deployment

> **MANUAL STEP REQUIRED** — this environment has no Rust toolchain, no
> `soroban`/`stellar` CLI, and no network access, so none of the following
> could be executed here. Run these on your own machine (macOS/Linux/WSL)
> with [Rust](https://rustup.rs) and the
> [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli)
> installed.

```bash
# 1. Add the wasm target (one-time)
rustup target add wasm32-unknown-unknown

# 2. From the repo root: build the contract
stellar contract build

# 3. Run the contract's unit tests
cd contracts/live_poll
cargo test
cd ../..

# 4. Create/fund a Testnet identity (one-time)
stellar keys generate admin --network testnet --fund

# 5. Deploy the built .wasm to Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/live_poll.wasm \
  --source admin \
  --network testnet
# ↑ copy the returned Contract ID into frontend/.env as VITE_STELLAR_CONTRACT_ID

# 6. Initialize the poll (replace CONTRACT_ID)
stellar contract invoke \
  --id CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address admin) \
  --question "Which programming language do you prefer?" \
  --options '["C++","Python","JavaScript"]'

# 7. Sanity-check a read call
stellar contract invoke \
  --id CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  get_poll
```

After this, cast one real vote from the running frontend (or via
`stellar contract invoke ... -- vote --voter <ADDR> --option 0`), then copy
the resulting transaction hash into this README's "Transaction Proof"
section below and verify it on
[Stellar Expert](https://stellar.expert/explorer/testnet).

The `stellar contract build` / `deploy` / `invoke` subcommands shown above
are the current (non-deprecated) Stellar CLI commands as of early 2026 —
confirm against `stellar contract --help` if you're on a different CLI
version.

---

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

---

## Live Demo

```text
Live Demo:
To be deployed
```

---

## Contract Address

```text
Stellar Testnet Contract:
<REAL CONTRACT ID — fill in after running the deployment steps above>
```

---

## Transaction Proof

```text
Transaction Hash:
<REAL TRANSACTION HASH — fill in after casting a real vote>
```

Verify it at:
`https://stellar.expert/explorer/testnet/tx/<TRANSACTION_HASH>`

---

## Wallet Screenshot

See `docs/wallet-options.png` (and `docs/README.md` for how to generate it —
it has to come from an actual running instance of the app, so it isn't
included yet).

---

## Vercel Deployment

> **MANUAL STEP REQUIRED** — needs your Vercel account/CLI login.

```bash
cd frontend
npm run build      # verify the production build succeeds locally first
npx vercel         # first deploy — follow the prompts
npx vercel --prod  # promote to production
```

**Vercel project settings:**

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables (Project Settings → Environment Variables):
  - `VITE_STELLAR_NETWORK`
  - `VITE_STELLAR_RPC_URL`
  - `VITE_STELLAR_CONTRACT_ID`
  - `VITE_STELLAR_EXPLORER_URL`

Once deployed, replace the "Live Demo" URL above with the real Vercel URL.

---

## Level 2 Requirement Verification

```text
[x] 3 error types handled (wallet not connected, tx rejected, tx/contract failure
    — plus invalid option, already voted, poll closed, network error, insufficient
    balance, wallet unavailable, timeout)
[x] Soroban smart contract created
[x] Contract tests written (initialize, valid vote, invalid option, double vote,
    vote-after-close, different wallets, vote counts, has_voted, event emitted)
[ ] Contract tests run and passing        — MANUAL STEP REQUIRED (no Rust toolchain here)
[ ] Contract deployed on Stellar Testnet  — MANUAL STEP REQUIRED
[ ] Real contract address obtained        — MANUAL STEP REQUIRED
[x] Frontend calls real contract (no mocks) via lib/contract.ts
[x] Wallet integration implemented (StellarWalletsKit)
[x] Multi-wallet options available (Freighter + others via wallet-selection modal)
[x] Voting transaction flow implemented (build → sign → submit → poll status)
[x] Transaction status component implemented
[ ] Real transaction hash displayed       — MANUAL STEP REQUIRED (after a real vote)
[x] Stellar Explorer links implemented
[x] VoteCast events integrated (RPC getEvents polling)
[x] Real-time results update (no full page refresh)
[x] Live activity feed implemented
[ ] Public GitHub repository              — MANUAL STEP REQUIRED (push this repo)
[x] README completed
[ ] Wallet screenshot included            — MANUAL STEP REQUIRED (needs a live run)
[ ] Contract address documented           — MANUAL STEP REQUIRED
[ ] Transaction hash documented           — MANUAL STEP REQUIRED
[x] 10+ meaningful commits
[x] No secrets committed (.env is gitignored, only .env.example is tracked)
[ ] Production build succeeds             — MANUAL STEP REQUIRED (npm install needs network)
```

---

## Manual Steps Summary

This project was generated in a sandboxed environment with **no network
access and no Rust/Soroban CLI installed**, so the following genuinely could
not be executed here. Everything else (all contract and frontend source
code, git history, and docs) is done.

1. `cd frontend && npm install && npm run build` — verify the production build
2. `rustup target add wasm32-unknown-unknown` — one-time Rust setup
3. `cd contracts/live_poll && cargo test` — run the contract's unit tests
4. `stellar contract build` — compile the contract to wasm
5. `stellar keys generate admin --network testnet --fund` — create a funded Testnet identity
6. `stellar contract deploy ...` — deploy to Testnet, get the real contract ID
7. `stellar contract invoke ... initialize ...` — set up the poll
8. Cast one real vote (from the running frontend) and record the real tx hash
9. Fill in `VITE_STELLAR_CONTRACT_ID` in `frontend/.env` and Vercel env vars
10. `npx vercel --prod` — deploy the frontend
11. Take the `docs/wallet-options.png` screenshot from the running app
12. Create a public GitHub repo and `git push` this local repo to it
13. Paste the real contract ID and transaction hash into the sections above
