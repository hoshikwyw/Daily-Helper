// The "nothing here yet" line shown inside an otherwise-empty card or list.
// Replaces the `<p className="text-slate-400 text-sm text-center py-N">`
// paragraph that was hand-written in eight places.

// Vertical breathing room. Denser lists (a sidebar) use less than a full card.
const PADDING = {
  sm: "py-4",
  md: "py-6",
  lg: "py-8",
  xl: "py-10",
} as const;

type EmptyStateProps = {
  children: React.ReactNode;
  padding?: keyof typeof PADDING;
};

export function EmptyState({ children, padding = "xl" }: EmptyStateProps) {
  return (
    <p className={`text-slate-400 text-sm text-center ${PADDING[padding]}`}>{children}</p>
  );
}
