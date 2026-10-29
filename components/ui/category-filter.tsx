type CategoryFilterProps = {
  options: { name: string; color: string }[];
  /** null means every category. */
  value: string | null;
  onChange: (category: string | null) => void;
};

const CHIP =
  "shrink-0 inline-flex items-center gap-2 min-h-10 px-3.5 rounded-full border text-sm font-medium transition-colors";
const CHIP_ON = "border-kv-500 bg-kv-500/15 text-white";
const CHIP_OFF = "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10";

/**
 * "All" plus one chip per spending category. A single row that scrolls
 * sideways on a phone rather than wrapping into a tall block above the
 * figures. Plain toggle buttons rather than radios: tapping the active chip
 * again clears the filter, which radio semantics would not allow.
 */
export function CategoryFilter({ options, value, onChange }: CategoryFilterProps) {
  return (
    <div role="group" aria-label="Filter by category" className="scroll-x flex gap-2 -mx-1 px-1 pb-1">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`${CHIP} ${value === null ? CHIP_ON : CHIP_OFF}`}
      >
        All
      </button>
      {options.map((option) => {
        const active = option.name === value;
        return (
          <button
            key={option.name}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : option.name)}
            className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
