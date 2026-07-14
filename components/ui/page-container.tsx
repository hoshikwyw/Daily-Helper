import { GradientBackground, GridPattern } from "@kwyw/kayv-glass-ui";

// The shared page frame every dashboard route used to hand-roll: a full-height
// padded column with the animated gradient background and faint grid overlay.
// Pages just provide their content (and optionally a custom grid `squares`
// pattern); everything inside is positioned above the background.

type PageContainerProps = {
  children: React.ReactNode;
  /** Grid dot coordinates for the decorative overlay. */
  squares?: [number, number][];
  className?: string;
};

const DEFAULT_SQUARES: [number, number][] = [[2, 1], [5, 3], [8, 2]];

export function PageContainer({
  children,
  squares = DEFAULT_SQUARES,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`relative min-h-screen p-4 sm:p-6 space-y-6 ${className}`}>
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={squares}
      />
      {children}
    </div>
  );
}
