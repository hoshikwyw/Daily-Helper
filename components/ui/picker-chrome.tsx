// The pieces the day calendar and the month picker share: the arrow header,
// the income/expense dots, the legend row, and the "back to now" button.

const NAV_BUTTON =
  "h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors";

type PickerHeaderProps = {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  /** What one arrow step is, for the arrow labels: "month" or "year". */
  unit: string;
};

export function PickerHeader({ title, onPrev, onNext, unit }: PickerHeaderProps) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onPrev} aria-label={`Previous ${unit}`} className={NAV_BUTTON}>
        ‹
      </button>
      <p className="flex-1 text-center text-sm font-semibold text-slate-100">{title}</p>
      <button type="button" onClick={onNext} aria-label={`Next ${unit}`} className={NAV_BUTTON}>
        ›
      </button>
    </div>
  );
}

/** Tile styling shared by day cells and month tiles. */
export function tileClass(selected: boolean, filled: boolean, current: boolean): string {
  const state = selected
    ? "bg-kv-500 text-white font-semibold"
    : filled
      ? "text-slate-100 bg-white/6 hover:bg-white/10"
      : "text-slate-500 hover:bg-white/5 hover:text-slate-300";
  const ring = current && !selected ? "ring-1 ring-kv-400/70" : "";
  return `rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${state} ${ring}`;
}

type ActivityDotsProps = {
  income: boolean;
  expense: boolean;
  /** On a selected (accent-filled) tile the dots go white to stay visible. */
  onAccent?: boolean;
  className?: string;
};

/** Green for income, rose for expense; a fixed-height slot so rows never shift. */
export function ActivityDots({ income, expense, onAccent = false, className = "" }: ActivityDotsProps) {
  return (
    <span className={`flex items-center gap-0.5 h-1.5 ${className}`}>
      {income && (
        <span className={`h-1.5 w-1.5 rounded-full ${onAccent ? "bg-white" : "bg-emerald-400"}`} />
      )}
      {expense && (
        <span className={`h-1.5 w-1.5 rounded-full ${onAccent ? "bg-white/70" : "bg-rose-400"}`} />
      )}
    </span>
  );
}

/** The dot legend with a summary ("12 of 31 days logged") on the right. */
export function ActivityLegend({ summary }: { summary: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Expense
      </span>
      <span className="ml-auto tabular-nums">{summary}</span>
    </div>
  );
}

/** Full-width quiet button that returns the view to the present. */
export function JumpButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-10 rounded-lg text-sm text-kv-400 hover:text-kv-300 hover:bg-white/5 transition-colors"
    >
      {children}
    </button>
  );
}
