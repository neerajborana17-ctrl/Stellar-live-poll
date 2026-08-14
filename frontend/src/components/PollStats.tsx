import type { PollData } from '../types';

interface PollStatsProps {
  poll: PollData;
  counts: number[];
}

export default function PollStats({ poll, counts }: PollStatsProps) {
  const total = counts.reduce((sum, c) => sum + c, 0);
  const leadingIndex = counts.length
    ? counts.reduce((best, c, i) => (c > counts[best] ? i : best), 0)
    : -1;
  const leading = total > 0 && leadingIndex >= 0 ? poll.options[leadingIndex] : '—';

  const stats = [
    { label: 'Total Votes', value: total.toString() },
    { label: 'Leading Option', value: leading },
    { label: 'Poll Status', value: poll.active ? 'ACTIVE' : 'CLOSED' },
    { label: 'Network', value: 'Stellar Testnet' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        Poll Statistics
      </h3>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-slate-400">{s.label}</dt>
            <dd
              className={`mt-0.5 truncate text-sm font-semibold ${
                s.label === 'Poll Status'
                  ? poll.active
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
