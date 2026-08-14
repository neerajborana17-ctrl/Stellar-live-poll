import { explorerAccountUrl, shortenAddress } from '../lib/stellar';
import type { ActivityItem } from '../types';

function timeAgo(ts: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        Live Activity
      </h3>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No activity yet. Votes will appear here in real time.
        </p>
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm animate-fade-in">
              <span className="mt-1 text-emerald-500" aria-hidden>
                🟢
              </span>
              <div>
                <a
                  href={explorerAccountUrl(item.voter)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs font-medium text-slate-700 hover:text-stellar-600"
                >
                  {shortenAddress(item.voter)}
                </a>{' '}
                <span className="text-slate-600">voted for {item.optionLabel}</span>
                <p className="text-xs text-slate-400">{timeAgo(item.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
