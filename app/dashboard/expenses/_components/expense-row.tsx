import {
  categoryColor,
  fmt,
  KIND_SIGNS,
  KIND_TEXT_COLORS,
  normalizeKind,
  type ColorMap,
} from "@/lib/expenses";
import type { Expense } from "@/lib/types";

export function ExpenseRow({
  expense,
  colorMap,
  onDelete,
}: {
  expense: Expense;
  colorMap: ColorMap;
  onDelete: (id: string) => void;
}) {
  // Normalised here as well as at the data boundary: this row indexes three
  // different lookup tables by kind, and a bad key takes the whole page down.
  const kind = normalizeKind(expense.kind);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 group hover:bg-white/8 transition-colors">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: categoryColor(colorMap, kind, expense.category) }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">
          {expense.description || expense.category}
        </p>
        <p className="text-xs text-slate-400">
          {expense.category} · {expense.date}
        </p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${KIND_TEXT_COLORS[kind]}`}>
        {KIND_SIGNS[kind]}
        {fmt(expense.amount)}
      </span>
      <button
        onClick={() => onDelete(expense.id)}
        className="hover-reveal transition-opacity text-slate-400 hover:text-red-400 text-xl leading-none shrink-0 h-11 w-11 flex items-center justify-center rounded-lg -mr-2"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}
