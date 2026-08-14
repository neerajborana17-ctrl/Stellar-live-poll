import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  rpc,
} from '@stellar/stellar-sdk';
import { CONTRACT_ID, NETWORK_PASSPHRASE, server } from './stellar';
import type { AppError, AppErrorCode, PollData } from '../types';

const contract = new Contract(CONTRACT_ID);

/** Maps the contract's numeric Error enum (see contracts/live_poll/src/lib.rs) to a code. */
const CONTRACT_ERROR_MAP: Record<number, AppErrorCode> = {
  1: 'POLL_NOT_INITIALIZED',
  2: 'UNKNOWN', // PollAlreadyInitialized — not user-facing
  3: 'POLL_CLOSED',
  4: 'INVALID_OPTION',
  5: 'ALREADY_VOTED',
  6: 'UNAUTHORIZED',
};

const FRIENDLY_MESSAGES: Record<AppErrorCode, string> = {
  WALLET_NOT_CONNECTED: 'Please connect your Stellar wallet before voting.',
  TX_REJECTED: 'Transaction rejected. You cancelled the transaction in your wallet.',
  TX_FAILED: 'Transaction failed. Please try again.',
  INVALID_OPTION: 'That option is not valid for this poll.',
  ALREADY_VOTED: 'You have already voted. Thank you for participating!',
  POLL_CLOSED: 'This poll is closed. Voting has ended, but results are still visible.',
  POLL_NOT_INITIALIZED: 'This poll has not been set up yet. Please check back soon.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NETWORK_ERROR: 'Could not reach the Stellar network. Check your connection and try again.',
  INSUFFICIENT_BALANCE: 'Your wallet does not have enough XLM to cover the transaction fee.',
  WALLET_UNAVAILABLE: 'No compatible Stellar wallet was found. Please install one and retry.',
  TIMEOUT: 'The transaction took too long to confirm. Check the explorer for its final status.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

export function toAppError(code: AppErrorCode): AppError {
  return { code, message: FRIENDLY_MESSAGES[code] };
}

/** Parses a Soroban simulation/send error string like `Error(Contract, #4)` into an AppError. */
export function mapSimulationError(raw: unknown): AppError {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  // eslint-disable-next-line no-console
  console.error('[live-poll] contract error:', raw);

  const match = text.match(/Error\(Contract,\s*#(\d+)\)/);
  if (match) {
    const num = Number(match[1]);
    return toAppError(CONTRACT_ERROR_MAP[num] ?? 'UNKNOWN');
  }
  if (/insufficient/i.test(text) || /underfunded/i.test(text)) {
    return toAppError('INSUFFICIENT_BALANCE');
  }
  if (/timeout/i.test(text)) {
    return toAppError('TIMEOUT');
  }
  if (/network|fetch|rpc/i.test(text)) {
    return toAppError('NETWORK_ERROR');
  }
  return toAppError('TX_FAILED');
}

/** Builds a throwaway source account for read-only simulation (no wallet required). */
function readOnlyAccount(): Account {
  return new Account(Keypair.random().publicKey(), '0');
}

async function simulateRead<T>(method: string, args: unknown[] = []): Promise<T> {
  const account = readOnlyAccount();
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args.map((a) => nativeToScVal(a))))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw mapSimulationError(sim.error);
  }
  if (!sim.result) {
    throw toAppError('UNKNOWN');
  }
  return scValToNative(sim.result.retval) as T;
}

export async function readPoll(): Promise<PollData> {
  const [question, options, active] = await simulateRead<[string, string[], boolean]>(
    'get_poll',
  );
  return { question, options, active };
}

export async function readResults(): Promise<number[]> {
  return simulateRead<number[]>('get_results');
}

export async function readHasVoted(voterAddress: string): Promise<boolean> {
  return simulateRead<boolean>('has_voted', [voterAddress]);
}

/**
 * Builds and simulates (Soroban-prepares) a `vote` transaction for the connected wallet
 * to sign. Throws a mapped AppError if simulation itself reveals a contract error
 * (e.g. already voted) — this lets the UI fail fast, before asking for a signature.
 */
export async function buildVoteTransaction(voterAddress: string, option: number) {
  const account = await server.getAccount(voterAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'vote',
        nativeToScVal(voterAddress, { type: 'address' }),
        nativeToScVal(option, { type: 'u32' }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return prepared;
}

/** Submits a wallet-signed transaction XDR and returns the transaction hash. */
export async function submitSignedTransaction(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(tx);

  if (sendResult.status === 'ERROR') {
    throw mapSimulationError(sendResult.errorResult ?? sendResult.status);
  }

  return sendResult.hash;
}

/** Polls `getTransaction` until the network reports SUCCESS or FAILED (or times out). */
export async function pollTransactionStatus(
  hash: string,
  { intervalMs = 2000, timeoutMs = 30000 } = {},
): Promise<'SUCCESS' | 'FAILED'> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await server.getTransaction(hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) return 'SUCCESS';
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) return 'FAILED';

    if (Date.now() - start > timeoutMs) {
      throw toAppError('TIMEOUT');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
