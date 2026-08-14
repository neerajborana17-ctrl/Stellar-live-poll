# `live_poll` Soroban Contract

A single-question, one-vote-per-wallet decentralized poll contract for Stellar Testnet.

## Functions

| Function | Description |
|---|---|
| `initialize(admin, question, options)` | Sets up the poll. Callable once. `admin` must sign. |
| `vote(voter, option)` | Casts a vote for `option` (0-based index). `voter` must sign. |
| `get_results()` | Returns a `Vec<u32>` of vote counts, in option order. |
| `get_vote_count(option)` | Returns the vote count for a single option. |
| `has_voted(voter)` | Returns `true`/`false`. |
| `get_poll()` | Returns `(question, options, active)`. |
| `close_poll(admin)` | Stops voting. Only the stored admin can call this. Results stay readable. |

## Errors

| Error | Meaning |
|---|---|
| `PollNotInitialized` (1) | `initialize` has not been called yet. |
| `PollAlreadyInitialized` (2) | `initialize` was already called once. |
| `PollClosed` (3) | Voting was attempted after `close_poll`. |
| `InvalidOption` (4) | The option index is out of range. |
| `AlreadyVoted` (5) | This address already has a stored vote. |
| `Unauthorized` (6) | Caller is not the poll admin (e.g. calling `close_poll`). |

## Build / test / deploy

See the root `README.md` → "Contract Deployment" for the exact Stellar CLI commands.
This repo does not vendor a Rust toolchain, so building, testing, and deploying the
contract must be done on your own machine.
