import { MONTHS, fmtCompactSigned, netTextColor, type MonthActivity } from "@/lib/expenses";
import { plural } from "@/lib/text";
import {
  ActivityDots,
  ActivityLegend,
  JumpButton,
  PickerHeader,
  tileClass,
} from "@/components/ui/picker-chrome";

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
      <PickerHeader
        title={String(year)}
        onPrev={() => onYearChange(year - 1)}
        onNext={() => onYearChange(year + 1)}
        unit="year"
      />

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
            ? `${name} ${year}, ${plural(info.days, "day")} logged`
            : `${name} ${year}, nothing logged`;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(month)}
              aria-label={label}
              aria-pressed={isSelected}
              className={`h-16 gap-0.5 ${tileClass(isSelected, filled, isCurrent)}`}
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
                  isSelected ? "text-white/90" : filled ? netTextColor(info.net) : ""
                }`}
              >
                {filled ? fmtCompactSigned(info.net) : ""}
              </span>
              <ActivityDots income={info.income} expense={info.expense} onAccent={isSelected} />
            </button>
          );
        })}
      </div>

      <ActivityLegend summary={`${loggedMonths} of 12 months logged`} />

      {year !== thisYear && <JumpButton onClick={jumpToThisYear}>Back to this year</JumpButton>}
    </div>
  );
}
