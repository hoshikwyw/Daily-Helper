// Loading placeholders. `Skeleton` is a single shimmering block; `SkeletonList`
// renders a stack of them for list/table loading states. Replaces the ad-hoc
// `{[1,2,3].map(...)}` pulse blocks scattered across pages.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-white/5 animate-pulse ${className}`} />;
}

type SkeletonListProps = {
  count?: number;
  rowClassName?: string;
  className?: string;
};

export function SkeletonList({
  count = 3,
  rowClassName = "h-12",
  className = "space-y-3",
}: SkeletonListProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}
