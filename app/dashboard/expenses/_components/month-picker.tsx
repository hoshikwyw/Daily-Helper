import { MONTHS, fmtCompactSigned, type MonthActivity } from "@/lib/expenses";

const NAV_BUTTON =
  "h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors";

type MonthPickerProps = {
  year: number;
  onYearChange: (year: number) => void;
  /** Zero-based month whose entries are shown. */
  selectedMonth: number;
  onSelect: (month: number) => void;
  /** Per-month roll-up for `year`, from `getMonthActivity`. */
  activity: MonthActivity[];
  /** Dims the grid while another year's entries are still loading. */
  loading?: boolean;
};

/**
 * The Monthly tab's counterpart to the day calendar: twelve month tiles for
 * one year, showing which months have entries. A month with entries carries
 * a dot: green for income, rose for expense, both when it has each, plus how
 * many days were logged. Tapping a month shows it; the arrows move year by
 * year and "Back to this year" jumps home.
 */
export function MonthPicker({
  year,
  onYearChange,
  selectedMonth,
  onSelect,
  activity,
  loading = false,
}: MonthPickerProps) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const loggedMonths = activity.filter((m) => m.days > 0).length;

  function jumpToThisYear() {
    onYearChange(thisYear);
    onSelect(now.getMonth());
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          aria-label="Previous year"
          className={NAV_BUTTON}
        >
          ‹
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-slate-100">{year}</p>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          aria-label="Next year"
          className={NAV_BUTTON}
        >
          ›
        </button>
      </div>

      <div
        className={`grid grid-cols-3 gap-1.5 transition-opacity ${loading ? "opacity-50" : ""}`}
        role="group"
        aria-label={`Months of ${year}`}
      >
        {MONTHS.map((name, month) => {
          const info = activity[month];
          const filled = info.days > 0;
          const isSelected = month === selectedMonth;
          const isCurrent = year === thisYear && month === now.getMonth();
          const label = filled
            ? `${name} ${year}, ${info.days} ${info.days === 1 ? "day" : "days"} logged`
            : `${name} ${year}, nothing logged`;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(month)}
              aria-label={label}
              aria-pressed={isSelected}
              className={`h-16 rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-colors ${
                isSelected
                  ? "bg-kv-500 text-white font-semibold"
                  : filled
                    ? "text-slate-100 bg-white/6 hover:bg-white/10"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              } ${isCurrent && !isSelected ? "ring-1 ring-kv-400/70" : ""}`}
            >
              <span className="leading-none">{name.slice(0, 3)}</span>
              <span
                className={`text-[11px] leading-none tabular-nums ${
                  isSelected ? "text-white/80" : filled ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {filled ? `${info.days}d` : "—"}
              </span>
              {/* The month's net, wide screens only, where the rail has room. */}
              <span
                className={`hidden lg:block h-3 text-[10px] leading-3 tabular-nums ${
                  isSelected
                    ? "text-white/90"
                    : !filled
                      ? ""
                      : info.net > 0
                        ? "text-emerald-400"
                        : info.net < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                }`}
              >
                {filled ? fmtCompactSigned(info.net) : ""}
              </span>
              <span className="flex items-center gap-0.5 h-1.5">
                {info.income && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`}
                  />
                )}
                {info.expense && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-rose-400"}`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Expense
        </span>
        <span className="ml-auto tabular-nums">{loggedMonths} of 12 months logged</span>
      </div>

      {year !== thisYear && (
        <button
          type="button"
          onClick={jumpToThisYear}
          className="w-full h-10 rounded-lg text-sm text-kv-400 hover:text-kv-300 hover:bg-white/5 transition-colors"
        >
          Back to this year
        </button>
      )}
    </div>
  );
}
