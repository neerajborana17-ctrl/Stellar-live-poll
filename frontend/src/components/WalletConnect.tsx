import { shortenAddress } from '../lib/stellar';

interface WalletConnectProps {
  address: string | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletConnect({
  address,
  connecting,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  if (address) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        <div className="text-sm leading-tight">
          <p className="font-medium text-slate-900">Connected</p>
          <p className="font-mono text-xs text-slate-500">{shortenAddress(address)}</p>
        </div>
        <button
          onClick={onDisconnect}
          className="ml-2 rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={connecting}
      className="rounded-full bg-stellar-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stellar-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
