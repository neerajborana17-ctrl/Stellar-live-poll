import { useState } from 'react';
import type { PollData, TxStatus } from '../types';

interface PollCardProps {
  poll: PollData;
  hasVoted: boolean;
  isConnected: boolean;
  txStatus: TxStatus;
  onVote: (option: number) => void;
}

const VOTING_IN_PROGRESS: TxStatus[] = [
  'preparing',
  'awaiting-approval',
  'submitted',
  'pending',
];

export default function PollCard({ poll, hasVoted, isConnected, txStatus, onVote }: PollCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const isVoting = VOTING_IN_PROGRESS.includes(txStatus);
  const disabled = !poll.active || hasVoted || isVoting;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{poll.question}</h2>

      {!poll.active && (
        <p className="mt-1 text-sm font-medium text-amber-600">
          This poll is closed. Results are still visible below.
        </p>
      )}

      {hasVoted ? (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-center">
          <p className="font-medium text-emerald-800">You have already voted.</p>
          <p className="text-sm text-emerald-700">Thank you for participating!</p>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-2">
            {poll.options.map((option, index) => (
              <label
                key={index}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  selected === index
                    ? 'border-stellar-500 bg-stellar-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="poll-option"
                  className="h-4 w-4 accent-stellar-600"
                  checked={selected === index}
                  disabled={disabled}
                  onChange={() => setSelected(index)}
                />
                <span className="text-sm font-medium text-slate-800">{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => selected !== null && onVote(selected)}
            disabled={disabled || selected === null}
            className="mt-5 w-full rounded-xl bg-stellar-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stellar-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isVoting ? 'Submitting vote…' : !isConnected ? 'Connect wallet to vote' : 'Vote'}
          </button>
        </>
      )}
    </div>
  );
}
