import { fmt, FALLBACK_CATEGORY_COLOR } from "@/lib/expenses";
import type { Expense } from "@/lib/types";

export function ExpenseRow({
  expense,
  colorMap,
  onDelete,
}: {
  expense: Expense;
  colorMap: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 group hover:bg-white/8 transition-colors">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: colorMap[expense.category] ?? FALLBACK_CATEGORY_COLOR }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">
          {expense.description || expense.category}
        </p>
        <p className="text-xs text-slate-500">
          {expense.category} · {expense.date}
        </p>
      </div>
      <span className="text-sm font-semibold text-white shrink-0">{fmt(expense.amount)}</span>
      <button
        onClick={() => onDelete(expense.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-lg leading-none shrink-0 px-1"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}
