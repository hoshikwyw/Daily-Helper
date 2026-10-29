import { daysInMonth, monthGrid, monthPrefix } from "@/lib/date";
import { MONTHS, countActiveDays, type DayActivity } from "@/lib/expenses";

type YearOverviewProps = {
  year: number;
  /** Which days have entries, from `getDayActivity`, for this year. */
  activity: Record<string, DayActivity>;
  /** Opens the day on the Daily tab. */
  onDayPick: (date: string) => void;
  /** Opens the month (zero-based) on the Monthly tab. */
  onMonthPick: (month: number) => void;
  loading?: boolean;
};

/** Cell colour by the day's net: what the day did to the balance overall. */
function cellClass(day: DayActivity | undefined): string {
  if (!day) return "bg-white/5";
  if (day.net > 0) return "bg-emerald-400/80";
  if (day.net < 0) return "bg-rose-400/80";
  return "bg-slate-400/70";
}

/**
 * Twelve tiny month grids showing the whole year's coverage at a glance:
 * which days were logged, and whether each ended up ahead or behind.
 *
 * Tapping a day opens it on the Daily tab. The cells are small by nature,
 * so each month's name is a larger target that opens that month instead.
 */
export function YearOverview({
  year,
  activity,
  onDayPick,
  onMonthPick,
  loading = false,
}: YearOverviewProps) {
  const daysInYear = daysInMonth(year, 1) === 29 ? 366 : 365;
  const loggedDays = countActiveDays(activity, String(year));

  return (
    <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-5">
        {MONTHS.map((name, month) => {
          const prefix = monthPrefix(year, month);
          const logged = countActiveDays(activity, prefix);
          const total = daysInMonth(year, month);

          return (
            <div key={name}>
              <button
                type="button"
                onClick={() => onMonthPick(month)}
                aria-label={`Open ${name} ${year}`}
                className="w-full flex items-baseline justify-between gap-2 mb-1.5 rounded-md px-1 -mx-1 min-h-8 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-sm font-medium text-slate-200">{name.slice(0, 3)}</span>
                <span className={`text-[11px] tabular-nums ${logged ? "text-slate-400" : "text-slate-600"}`}>
                  {logged}/{total}
                </span>
              </button>

              <div className="grid grid-cols-7 gap-0.75" role="group" aria-label={`${name} ${year}`}>
                {monthGrid(year, month)
                  .flat()
                  .map((iso, i) => {
                    if (!iso) return <span key={`pad-${i}`} aria-hidden="true" />;
                    const day = activity[iso];
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => onDayPick(iso)}
                        aria-label={
                          day
                            ? `${iso}, ${day.count} ${day.count === 1 ? "entry" : "entries"}`
                            : `${iso}, no entries`
                        }
                        className={`aspect-square w-full rounded-[3px] transition-transform hover:scale-125 hover:ring-1 hover:ring-white/40 ${cellClass(day)}`}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-400/80" /> Ahead
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-rose-400/80" /> Behind
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-white/5 ring-1 ring-white/10" /> Nothing logged
        </span>
        <span className="ml-auto tabular-nums">
          {loggedDays} of {daysInYear} days logged
        </span>
      </div>
    </div>
  );
}
