"use client";

// A burst of small four-point stars around a point, in SVG coordinates.
// Mount it with a changing `key` so the keyframes restart on each reward.
// CSS does the motion; without it the stars simply show for the reaction.

const STARS = [
  { dx: -30, dy: -34, s: 1, delay: 0 },
  { dx: 28, dy: -40, s: 0.8, delay: 0.1 },
  { dx: -38, dy: -6, s: 0.7, delay: 0.2 },
  { dx: 40, dy: -12, s: 0.9, delay: 0.15 },
  { dx: -12, dy: -50, s: 0.6, delay: 0.3 },
  { dx: 14, dy: -56, s: 0.75, delay: 0.25 },
];

const COLORS = ["#F9C9B0", "#C9B8E8", "#AFC9E8", "#FFF6E5", "#B7C9A8", "#F9C9B0"];

type SparklesProps = {
  cx: number;
  cy: number;
};

export function Sparkles({ cx, cy }: SparklesProps) {
  return (
    <g className="game-anim" aria-hidden="true">
      {STARS.map((star, i) => (
        // The outer group places the star; the inner one animates. CSS
        // `transform` in the keyframes would otherwise replace the placement.
        <g key={i} transform={`translate(${cx + star.dx} ${cy + star.dy}) scale(${star.s})`}>
          <g className="game-sparkle" style={{ animationDelay: `${star.delay}s` }}>
            <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" fill={COLORS[i]} />
          </g>
        </g>
      ))}
    </g>
  );
}
