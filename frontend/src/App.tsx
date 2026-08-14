import { useCallback } from 'react';
import toast from 'react-hot-toast';
import Navbar from './components/Navbar';
import PollCard from './components/PollCard';
import PollResults from './components/PollResults';
import PollStats from './components/PollStats';
import TransactionStatus from './components/TransactionStatus';
import ActivityFeed from './components/ActivityFeed';
import ErrorMessage from './components/ErrorMessage';
import ContractInfo from './components/ContractInfo';
import { useWallet } from './hooks/useWallet';
import { usePoll } from './hooks/usePoll';
import { useEvents } from './hooks/useEvents';
import { CONTRACT_ID } from './lib/stellar';

export default function App() {
  const { address, isConnected, connecting, connect, disconnect } = useWallet();
  const { poll, results, hasVoted, loading, loadError, tx, vote, refresh } = usePoll(address);

  const handleConnect = useCallback(async () => {
    const err = await connect();
    if (err) toast.error(err.message);
  }, [connect]);

  const onExternalVote = useCallback(() => {
    refresh();
  }, [refresh]);

  const { activity } = useEvents(poll?.options ?? [], onExternalVote);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar
        address={address}
        connecting={connecting}
        onConnect={handleConnect}
        onDisconnect={disconnect}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {!CONTRACT_ID && (
          <ErrorMessage message="VITE_STELLAR_CONTRACT_ID is not set. Copy .env.example to .env and add your deployed contract ID." />
        )}

        {loading && (
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Loading poll…
          </div>
        )}

        {!loading && loadError && (
          <ErrorMessage message={loadError.message} onRetry={refresh} />
        )}

        {!loading && poll && (
          <>
            <PollCard
              poll={poll}
              hasVoted={hasVoted}
              isConnected={isConnected}
              txStatus={tx.status}
              onVote={vote}
            />

            <TransactionStatus {...tx} />

            <PollResults options={poll.options} counts={results} />
            <PollStats poll={poll} counts={results} />
            <ActivityFeed items={activity} />
            <ContractInfo />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 text-center text-xs text-slate-400">
        Built with React, TypeScript, and Soroban — Stellar Testnet only.
      </footer>
    </div>
  );
}
