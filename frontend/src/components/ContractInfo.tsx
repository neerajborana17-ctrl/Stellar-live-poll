import { CONTRACT_ID, explorerContractUrl } from '../lib/stellar';

export default function ContractInfo() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Smart Contract
      </h3>
      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <dt className="text-slate-500">Network</dt>
          <dd className="font-medium text-slate-900">Stellar Testnet</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <dt className="text-slate-500">Contract</dt>
          <dd className="break-all font-mono text-xs text-slate-900">
            {CONTRACT_ID || 'Not deployed yet — set VITE_STELLAR_CONTRACT_ID'}
          </dd>
        </div>
      </dl>
      {CONTRACT_ID && (
        <a
          href={explorerContractUrl(CONTRACT_ID)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-stellar-600 underline"
        >
          View Contract →
        </a>
      )}
    </div>
  );
}
