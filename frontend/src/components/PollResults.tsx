interface PollResultsProps {
  options: string[];
  counts: number[];
}

export default function PollResults({ options, counts }: PollResultsProps) {
  const total = counts.reduce((sum, c) => sum + c, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        Live Results
      </h3>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No votes yet. Be the first to vote!
        </p>
      ) : (
        <div className="space-y-4">
          {options.map((option, index) => {
            const count = counts[index] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={index}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{option}</span>
                  <span className="text-slate-500">
                    {count} vote{count === 1 ? '' : 's'} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-stellar-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-right text-xs font-medium text-slate-400">
        Total votes: {total}
      </p>
    </div>
  );
}
