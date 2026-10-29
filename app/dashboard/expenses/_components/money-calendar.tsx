import { monthGrid, monthPrefix, todayISO } from "@/lib/date";
import { MONTHS, countActiveDays, fmtCompactSigned, type DayActivity } from "@/lib/expenses";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const NAV_BUTTON =
  "h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors";

type MoneyCalendarProps = {
  /** Full year and zero-based month of the month on screen. */
  viewYear: number;
  viewMonth: number;
  onViewChange: (year: number, month: number) => void;
  /**
   * `YYYY-MM-DD` of the highlighted day. Omit when the calendar is only an
   * overview with no current day, as on the Monthly tab; "Back to today"
   * then just returns the view to this month.
   */
  selectedDate?: string;
  onSelect: (date: string) => void;
  /** Which days have entries, from `getDayActivity`. */
  activity: Record<string, DayActivity>;
  /** Dims the grid while another year's entries are still loading. */
  loading?: boolean;
};

/**
 * A mini month calendar that shows at a glance which days have money entries.
 *
 * A day with entries carries a dot under its number: green for income, rose
 * for expense, both when the day has each. Tapping a day shows its entries;
 * the arrows move month by month and "Back to today" jumps home.
 *
 * Hand-rolled rather than the library Calendar because that one keeps its
 * visible month private: the page could never learn the user had flipped to
 * another year, so it could never fetch that year's entries to mark the days.
 */
export function MoneyCalendar({
  viewYear,
  viewMonth,
  onViewChange,
  selectedDate,
  onSelect,
  activity,
  loading = false,
}: MoneyCalendarProps) {
  const rows = monthGrid(viewYear, viewMonth);
  const today = todayISO();
  const prefix = monthPrefix(viewYear, viewMonth);
  const activeDays = countActiveDays(activity, prefix);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const showingToday = today.startsWith(prefix);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    onViewChange(next.getFullYear(), next.getMonth());
  }

  function jumpToToday() {
    const now = new Date();
    onViewChange(now.getFullYear(), now.getMonth());
    if (selectedDate !== undefined) onSelect(today);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className={NAV_BUTTON}
        >
          ‹
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-slate-100">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className={NAV_BUTTON}
        >
          ›
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? "opacity-50" : ""}`}
        role="grid"
        aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 pb-1"
          >
            {day}
          </div>
        ))}

        {rows.flat().map((iso, i) => {
          if (!iso) return <div key={`pad-${i}`} aria-hidden="true" />;

          const day = activity[iso];
          const isSelected = iso === selectedDate;
          const isToday = iso === today;
          const label = day
            ? `${iso}, ${day.count} ${day.count === 1 ? "entry" : "entries"}`
            : `${iso}, no entries`;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={label}
              aria-pressed={isSelected}
              className={`relative h-10 sm:h-11 lg:h-14 rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                isSelected
                  ? "bg-kv-500 text-white font-semibold"
                  : day
                    ? "text-slate-100 bg-white/6 hover:bg-white/10"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              } ${isToday && !isSelected ? "ring-1 ring-kv-400/70" : ""}`}
            >
              <span className="leading-none">{Number(iso.slice(-2))}</span>
              {/* The day's net, wide screens only: a phone cell is too narrow
                  for figures, so there the dots carry the story alone. */}
              <span
                className={`hidden lg:block h-3 mt-0.5 text-[10px] leading-3 tabular-nums ${
                  isSelected
                    ? "text-white/90"
                    : !day
                      ? ""
                      : day.net > 0
                        ? "text-emerald-400"
                        : day.net < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                }`}
              >
                {day ? fmtCompactSigned(day.net) : ""}
              </span>
              {/* Fixed-height slot so rows don't shift between filled and empty days. */}
              <span className="flex items-center gap-0.5 h-1.5 mt-1">
                {day?.income && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`}
                  />
                )}
                {day?.expense && (
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
        <span className="ml-auto">
          {activeDays} of {daysInMonth} days logged
        </span>
      </div>

      {!showingToday && (
        <button
          type="button"
          onClick={jumpToToday}
          className="w-full h-10 rounded-lg text-sm text-kv-400 hover:text-kv-300 hover:bg-white/5 transition-colors"
        >
          Back to today
        </button>
      )}
    </div>
  );
}
