import { FormLabel } from "@/components/ui/label";
import { formatLongDate, fromISODate, todayISO } from "@/lib/date";
import {
  REPEAT_MODES,
  WEEKDAY_SHORT,
  buildSchedule,
  describeSchedule,
  occurrenceOnOrAfter,
  type RepeatChoice,
  type RepeatMode,
} from "@/lib/recurrence";

type RepeatPickerProps = {
  value: RepeatChoice;
  onChange: (value: RepeatChoice) => void;
  /** The form's date; the schedule is anchored on it. */
  date: string;
  label?: string;
};

/** Monday first, matching the calendars. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const CHIP =
  "min-h-10 px-3.5 rounded-full border text-sm font-medium transition-colors";
const CHIP_ON = "border-kv-500 bg-kv-500/15 text-white";
const CHIP_OFF = "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10";

/**
 * "Never / Daily / Weekdays / Weekly / Monthly / Yearly / Custom days" chips
 * for a form, with a line underneath saying exactly what the choice means
 * for the chosen date. "Custom days" opens a row of day toggles.
 */
export function RepeatPicker({ value, onChange, date, label = "Repeat" }: RepeatPickerProps) {
  function pickMode(mode: RepeatMode) {
    if (mode === "custom") {
      // Start the custom pick from the form's own day so it is never empty.
      const days = value.days.length > 0 ? value.days : [fromISODate(date).getDay()];
      onChange({ mode, days });
      return;
    }
    onChange({ mode, days: [] });
  }

  function toggleDay(day: number) {
    const days = value.days.includes(day)
      ? value.days.filter((d) => d !== day)
      : [...value.days, day];
    onChange({ mode: "custom", days });
  }

  const schedule = date ? buildSchedule(value, date) : null;
  let hint: string;
  if (value.mode === "never") {
    hint = "A one-off; it will not be created again.";
  } else if (!schedule) {
    hint = "Pick at least one day.";
  } else {
    const first = occurrenceOnOrAfter(schedule, date) ?? date;
    hint = `${describeSchedule(schedule)}, first on ${formatLongDate(first)}.`;
    if (first < todayISO()) hint += " Dates missed since then will be filled in.";
  }

  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {REPEAT_MODES.map((option) => {
          const active = option.value === value.mode;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pickMode(option.value)}
              className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {value.mode === "custom" && (
        <div className="grid grid-cols-7 gap-1.5 mt-3" role="group" aria-label="Days of the week">
          {DAY_ORDER.map((day) => {
            const on = value.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(day)}
                className={`min-h-10 rounded-lg border text-xs font-medium transition-colors ${
                  on ? CHIP_ON : CHIP_OFF
                }`}
              >
                {WEEKDAY_SHORT[day]}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">{hint}</p>
    </div>
  );
}
