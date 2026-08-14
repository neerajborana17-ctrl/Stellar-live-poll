export type TxStatus =
  | 'idle'
  | 'preparing'
  | 'awaiting-approval'
  | 'submitted'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export interface TxState {
  status: TxStatus;
  hash?: string;
  errorMessage?: string;
}

/** Friendly, user-facing error. Raw details are always logged to console instead. */
export interface AppError {
  code: AppErrorCode;
  message: string;
}

export type AppErrorCode =
  | 'WALLET_NOT_CONNECTED'
  | 'TX_REJECTED'
  | 'TX_FAILED'
  | 'INVALID_OPTION'
  | 'ALREADY_VOTED'
  | 'POLL_CLOSED'
  | 'POLL_NOT_INITIALIZED'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_BALANCE'
  | 'WALLET_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface PollData {
  question: string;
  options: string[];
  active: boolean;
}

export interface PollResults {
  counts: number[];
  total: number;
}

export interface ActivityItem {
  id: string;
  voter: string;
  option: number;
  optionLabel: string;
  timestamp: number;
  txHash?: string;
}
