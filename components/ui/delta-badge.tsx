import type { Delta } from "@/lib/progress";

type DeltaBadgeProps = {
  delta: Delta;
  /** Formats the absolute difference, e.g. `fmt` for money. Defaults to the number. */
  format?: (n: number) => string;
  /** Which direction counts as good: more tasks is up, less spending is down. */
  goodWhen: "up" | "down";
  /** What the figure is compared with: "last week", "last month", … */
  against?: string;
};

/** "▲ 2 vs last week" in green or rose, or "same as last week" in grey. */
export function DeltaBadge({ delta, format = String, goodWhen, against = "last week" }: DeltaBadgeProps) {
  if (delta.direction === "same") {
    return <span className="text-xs text-slate-500">same as {against}</span>;
  }
  const good = delta.direction === goodWhen;
  return (
    <span className={`text-xs tabular-nums ${good ? "text-emerald-400" : "text-rose-400"}`}>
      {delta.direction === "up" ? "▲" : "▼"} {format(Math.abs(delta.diff))} vs {against}
    </span>
  );
}
