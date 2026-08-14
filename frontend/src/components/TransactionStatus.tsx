import { explorerTxUrl } from '../lib/stellar';
import type { TxState } from '../types';

const STEPS: { key: TxState['status']; label: string }[] = [
  { key: 'preparing', label: 'Preparing transaction' },
  { key: 'awaiting-approval', label: 'Waiting for wallet approval' },
  { key: 'submitted', label: 'Transaction submitted' },
  { key: 'pending', label: 'Transaction pending' },
  { key: 'confirmed', label: 'Transaction confirmed' },
];

function stepIndex(status: TxState['status']) {
  return STEPS.findIndex((s) => s.key === status);
}

export default function TransactionStatus({ status, hash, errorMessage }: TxState) {
  if (status === 'idle') return null;

  if (status === 'failed' || status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 animate-fade-in">
        <p className="font-semibold text-red-800">
          {status === 'rejected' ? 'Transaction rejected' : 'Transaction failed'}
        </p>
        <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
        {hash && (
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-red-700 underline"
          >
            View on Stellar Explorer
          </a>
        )}
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 animate-fade-in">
        <p className="font-semibold text-emerald-800">Vote successfully recorded!</p>
        {hash && (
          <>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-emerald-600">
              Transaction
            </p>
            <p className="break-all font-mono text-xs text-emerald-800">{hash}</p>
            <a
              href={explorerTxUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-emerald-700 underline"
            >
              View on Stellar Explorer
            </a>
          </>
        )}
      </div>
    );
  }

  const current = stepIndex(status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-fade-in">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Transaction Status
      </p>
      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const isDone = i < current;
          const isCurrent = i === current;
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'animate-pulse bg-stellar-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span className={isCurrent ? 'font-medium text-slate-900' : 'text-slate-500'}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
