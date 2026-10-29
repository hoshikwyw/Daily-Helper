import { daysInMonth, monthGrid, monthPrefix, todayISO } from "@/lib/date";
import {
  MONTHS,
  countActiveDays,
  fmtCompactSigned,
  netTextColor,
  type DayActivity,
} from "@/lib/expenses";
import { plural } from "@/lib/text";
import {
  ActivityDots,
  ActivityLegend,
  JumpButton,
  PickerHeader,
  tileClass,
} from "./picker-chrome";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type MoneyCalendarProps = {
  /** Full year and zero-based month of the month on screen. */
  viewYear: number;
  viewMonth: number;
  onViewChange: (year: number, month: number) => void;
  /**
   * `YYYY-MM-DD` of the highlighted day. Omit when the calendar is only an
   * overview with no current day; "Back to today" then just returns the view
   * to this month.
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
      <PickerHeader
        title={`${MONTHS[viewMonth]} ${viewYear}`}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        unit="month"
      />

      <div
        className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? "opacity-50" : ""}`}
        // A group, not an ARIA grid: that role demands row/gridcell children,
        // and the labelled buttons already read well on their own.
        role="group"
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
          const label = day ? `${iso}, ${plural(day.count, "entry", "entries")}` : `${iso}, no entries`;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={label}
              // Only a toggle where there is a selection; otherwise the days
              // are plain buttons that open a day.
              aria-pressed={selectedDate !== undefined ? isSelected : undefined}
              className={`relative h-10 sm:h-11 lg:h-14 ${tileClass(isSelected, Boolean(day), iso === today)}`}
            >
              <span className="leading-none">{Number(iso.slice(-2))}</span>
              {/* The day's net, wide screens only: a phone cell is too narrow
                  for figures, so there the dots carry the story alone. */}
              <span
                className={`hidden lg:block h-3 mt-0.5 text-[10px] leading-3 tabular-nums ${
                  isSelected ? "text-white/90" : day ? netTextColor(day.net) : ""
                }`}
              >
                {day ? fmtCompactSigned(day.net) : ""}
              </span>
              <ActivityDots
                income={Boolean(day?.income)}
                expense={Boolean(day?.expense)}
                onAccent={isSelected}
                className="mt-1"
              />
            </button>
          );
        })}
      </div>

      <ActivityLegend summary={`${activeDays} of ${daysInMonth(viewYear, viewMonth)} days logged`} />

      {!showingToday && <JumpButton onClick={jumpToToday}>Back to today</JumpButton>}
    </div>
  );
}
