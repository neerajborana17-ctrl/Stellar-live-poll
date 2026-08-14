import { rpc, Networks } from '@stellar/stellar-sdk';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit';

export const NETWORK = (import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet') as
  | 'testnet'
  | 'mainnet';

export const NETWORK_PASSPHRASE =
  NETWORK === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;

export const RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';

export const CONTRACT_ID = import.meta.env.VITE_STELLAR_CONTRACT_ID ?? '';

export const EXPLORER_URL =
  import.meta.env.VITE_STELLAR_EXPLORER_URL ?? 'https://stellar.expert/explorer/testnet';

/** Shared Soroban RPC client used for simulation, submission, and event polling. */
export const server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith('http://') });

/**
 * Multi-wallet connector (Freighter, xBull, Albedo, Rabet, Lobstr, WalletConnect, etc.)
 * via @creit.tech/stellar-wallets-kit — the current community-recommended way to support
 * more than one Stellar wallet without hand-rolling each wallet's extension API.
 */
export const walletsKit = new StellarWalletsKit({
  network: NETWORK === 'testnet' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAccountUrl(address: string): string {
  return `${EXPLORER_URL}/account/${address}`;
}

export function explorerContractUrl(contractId: string): string {
  return `${EXPLORER_URL}/contract/${contractId}`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
