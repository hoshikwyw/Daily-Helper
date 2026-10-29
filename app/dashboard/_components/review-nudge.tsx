import Link from "next/link";

/**
 * A one-line invitation to the weekly review, shown on Mondays only: the
 * week has just closed and the figures are complete. Any other day the
 * Review entry in the navigation is enough.
 */
export function ReviewNudge({ date }: { date: Date }) {
  if (date.getDay() !== 1) return null;
  return (
    <Link
      href="/dashboard/review"
      className="relative flex items-center gap-3 rounded-xl border border-kv-500/30 bg-kv-500/10 px-4 py-3 text-sm text-kv-100 hover:bg-kv-500/15 transition-colors"
    >
      <span aria-hidden="true">🗓️</span>
      <span className="flex-1">New week. Take two minutes to look back at last week.</span>
      <span className="text-kv-300 shrink-0">Review →</span>
    </Link>
  );
}
