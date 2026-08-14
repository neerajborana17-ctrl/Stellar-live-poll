import WalletConnect from './WalletConnect';

interface NavbarProps {
  address: string | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Navbar({ address, connecting, onConnect, onDisconnect }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            🗳️ Stellar Live Poll
          </h1>
          <p className="text-xs text-slate-500">
            Network:{' '}
            <span className="font-medium text-stellar-600">Stellar Testnet</span>
          </p>
        </div>
        <WalletConnect
          address={address}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}
