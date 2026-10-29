import { FormLabel } from "@/components/ui/label";
import { formatLongDate, todayISO } from "@/lib/date";
import { CADENCES, describeSchedule, scheduleFromDate } from "@/lib/recurrence";
import type { RecurrenceCadence } from "@/lib/types";

type RepeatPickerProps = {
  /** null means a one-off. */
  value: RecurrenceCadence | null;
  onChange: (value: RecurrenceCadence | null) => void;
  /** The form's date; the schedule is anchored on it. */
  date: string;
  label?: string;
};

/**
 * "Never / Daily / Weekly / Monthly / Yearly" chips for a form, with a line
 * underneath saying exactly what the chosen option means for the chosen date,
 * so "Monthly" on the 31st is never a surprise.
 */
export function RepeatPicker({ value, onChange, date, label = "Repeat" }: RepeatPickerProps) {
  const options: { value: RecurrenceCadence | null; label: string }[] = [
    { value: null, label: "Never" },
    ...CADENCES,
  ];

  let hint = "A one-off; it will not be created again.";
  if (value && date) {
    hint = `${describeSchedule(scheduleFromDate(value, date))}, starting ${formatLongDate(date)}.`;
    if (date < todayISO()) hint += " Dates missed since then will be filled in.";
  }

  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`min-h-10 px-3.5 rounded-full border text-sm font-medium transition-colors ${
                active
                  ? "border-kv-500 bg-kv-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-2">{hint}</p>
    </div>
  );
}
