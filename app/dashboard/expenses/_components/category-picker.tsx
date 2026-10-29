import { FormLabel } from "@/components/ui/label";

type CategoryPickerProps = {
  categories: { name: string; color: string }[];
  value: string;
  onChange: (name: string) => void;
  label?: string;
};

/**
 * A grid of tappable category chips, replacing a `<select>`.
 *
 * The native list hid the category colours and cost two taps; the chips show
 * every category with its colour at a glance and select in one. Long lists
 * (many custom categories) scroll inside the grid rather than stretching the
 * modal off the bottom of a phone.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Category",
}: CategoryPickerProps) {
  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 -mr-1"
      >
        {categories.map((category) => {
          const active = category.name === value;
          return (
            <button
              key={category.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(category.name)}
              className={`flex items-center gap-2.5 min-h-11 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${
                active
                  ? "border-kv-500 bg-kv-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${active ? "ring-2 ring-white/40" : ""}`}
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
