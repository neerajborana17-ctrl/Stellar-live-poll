import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  buildVoteTransaction,
  mapSimulationError,
  pollTransactionStatus,
  readHasVoted,
  readPoll,
  readResults,
  submitSignedTransaction,
  toAppError,
} from '../lib/contract';
import { walletsKit } from '../lib/stellar';
import type { AppError, PollData, TxState } from '../types';

export function usePoll(voterAddress: string | null) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [results, setResults] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<AppError | null>(null);
  const [tx, setTx] = useState<TxState>({ status: 'idle' });

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      const [pollData, resultsData] = await Promise.all([readPoll(), readResults()]);
      setPoll(pollData);
      setResults(resultsData);

      if (voterAddress) {
        setHasVoted(await readHasVoted(voterAddress));
      } else {
        setHasVoted(false);
      }
    } catch (err) {
      const appErr = err && typeof err === 'object' && 'code' in err ? (err as AppError) : mapSimulationError(err);
      setLoadError(appErr);
    } finally {
      setLoading(false);
    }
  }, [voterAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const vote = useCallback(
    async (option: number) => {
      // ERROR 1 — wallet not connected
      if (!voterAddress) {
        const err = toAppError('WALLET_NOT_CONNECTED');
        toast.error(err.message);
        setTx({ status: 'idle', errorMessage: err.message });
        return;
      }

      try {
        setTx({ status: 'preparing' });
        const prepared = await buildVoteTransaction(voterAddress, option);

        setTx({ status: 'awaiting-approval' });
        let signedXdr: string;
        try {
          const signed = await walletsKit.signTransaction(prepared.toXDR(), {
            address: voterAddress,
          });
          signedXdr = signed.signedTxXdr;
        } catch (err) {
          // ERROR 2 — user rejected the transaction in their wallet
          console.error('[live-poll] user rejected signing:', err);
          const appErr = toAppError('TX_REJECTED');
          setTx({ status: 'rejected', errorMessage: appErr.message });
          toast.error(appErr.message);
          return;
        }

        setTx({ status: 'submitted' });
        const hash = await submitSignedTransaction(signedXdr);

        setTx({ status: 'pending', hash });
        const outcome = await pollTransactionStatus(hash);

        if (outcome === 'FAILED') {
          // ERROR 3 — blockchain/contract transaction failure
          const appErr = toAppError('TX_FAILED');
          setTx({ status: 'failed', hash, errorMessage: appErr.message });
          toast.error(appErr.message);
          return;
        }

        setTx({ status: 'confirmed', hash });
        toast.success('Vote successfully recorded!');
        await refresh();
      } catch (err) {
        const appErr =
          err && typeof err === 'object' && 'code' in err ? (err as AppError) : mapSimulationError(err);
        setTx({ status: 'failed', errorMessage: appErr.message });
        toast.error(appErr.message);
      }
    },
    [voterAddress, refresh],
  );

  const resetTx = useCallback(() => setTx({ status: 'idle' }), []);

  return { poll, results, hasVoted, loading, loadError, tx, vote, resetTx, refresh };
}
