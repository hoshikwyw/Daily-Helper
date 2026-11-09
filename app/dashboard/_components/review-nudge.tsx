import Link from "next/link";

/**
 * The way into the weekly review from Today. On Mondays it is an invitation:
 * the week has just closed and the figures are complete. Other days it is a
 * quiet one-line link, shown only below the desktop breakpoint, because the
 * phone's bottom nav has no Review slot (My World took it) while the desktop
 * sidebar still lists Review.
 */
export function ReviewNudge({ date }: { date: Date }) {
  if (date.getDay() !== 1) {
    return (
      <Link
        href="/dashboard/review"
        className="relative flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors lg:hidden"
      >
        <span aria-hidden="true">🗓️</span>
        <span className="flex-1">Weekly review</span>
        <span className="shrink-0">→</span>
      </Link>
    );
  }
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
