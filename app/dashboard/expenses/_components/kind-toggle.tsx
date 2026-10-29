import { FormLabel } from "@/components/ui/label";
import { ENTRY_KINDS } from "@/lib/expenses";
import type { EntryKind } from "@/lib/types";

type KindToggleProps = {
  value: EntryKind;
  onChange: (kind: EntryKind) => void;
  /** Optional label above the pair; omit where the modal title already says it. */
  label?: string;
};

/** The two-button money-out / money-in switch shared by the money modals. */
export function KindToggle({ value, onChange, label }: KindToggleProps) {
  return (
    <div>
      {label && <FormLabel>{label}</FormLabel>}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label ?? "Kind"}>
        {ENTRY_KINDS.map(({ value: kind, label: kindLabel }) => {
          const active = value === kind;
          const activeClass =
            kind === "income"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500 bg-rose-500/10 text-rose-300";
          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(kind)}
              className={`min-h-11 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                active ? activeClass : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {kind === "income" ? "↓ " : "↑ "}
              {kindLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
