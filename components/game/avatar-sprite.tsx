"use client";

import type { AvatarMood } from "./scene-state";

type AvatarSpriteProps = {
  mood?: AvatarMood;
  /** Rendered width in CSS pixels; height follows. */
  size?: number;
  className?: string;
};

// Placeholder avatar until the sprite assets arrive in the next part: a small
// sprout character drawn as inline SVG so it scales crisply at any size and
// needs no image request. Expressions change with the mood; motion is CSS.
export function AvatarSprite({ mood = "idle", size = 96, className = "" }: AvatarSpriteProps) {
  const asleep = mood === "sleep";
  const happy = mood === "happy" || mood === "celebrate";
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      role="img"
      aria-label={`Your sprout, ${MOOD_LABEL[mood]}`}
      className={`game-anim game-avatar game-mood-${mood} ${className}`}
      shapeRendering="geometricPrecision"
    >
      {/* leaf */}
      <path d="M32 14 C 30 4, 40 2, 44 8 C 40 10, 36 12, 32 14 Z" fill="#8FAE82" />
      <path d="M32 14 C 34 6, 24 2, 20 8 C 24 10, 28 12, 32 14 Z" fill="#B7C9A8" />
      <line x1="32" y1="14" x2="32" y2="22" stroke="#8FAE82" strokeWidth="2.5" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="32" cy="46" rx="22" ry="24" fill="#CFE0C3" />
      <ellipse cx="32" cy="50" rx="17" ry="17" fill="#DCE9D2" />
      {/* eyes */}
      {asleep ? (
        <>
          <path d="M22 44 q4 3 8 0" stroke="#4B5563" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M34 44 q4 3 8 0" stroke="#4B5563" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : happy ? (
        <>
          <path d="M22 45 q4 -4 8 0" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M34 45 q4 -4 8 0" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="26" cy="44" r="2.6" fill="#374151" className="game-eye" />
          <circle cx="38" cy="44" r="2.6" fill="#374151" className="game-eye" />
        </>
      )}
      {/* blush and mouth */}
      <circle cx="20" cy="50" r="3" fill="#F9C9B0" opacity="0.9" />
      <circle cx="44" cy="50" r="3" fill="#F9C9B0" opacity="0.9" />
      {asleep ? (
        <circle cx="32" cy="53" r="1.6" fill="#6B7280" />
      ) : (
        <path d={happy ? "M27 52 q5 5 10 0" : "M29 53 q3 2 6 0"} stroke="#6B7280" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* props for the two activity moods */}
      {mood === "reading" && (
        <g transform="translate(20 56)">
          <rect x="0" y="0" width="24" height="10" rx="1.5" fill="#C9B8E8" />
          <line x1="12" y1="0" x2="12" y2="10" stroke="#FFF6E5" strokeWidth="1.5" />
        </g>
      )}
      {mood === "exercise" && (
        <g transform="translate(14 58)">
          <rect x="0" y="2" width="36" height="3" rx="1.5" fill="#6B7280" />
          <rect x="-2" y="0" width="6" height="7" rx="1.5" fill="#AFC9E8" />
          <rect x="32" y="0" width="6" height="7" rx="1.5" fill="#AFC9E8" />
        </g>
      )}
      {asleep && (
        <text x="48" y="22" fontSize="10" fill="#C9B8E8" fontWeight="700" className="game-zzz">
          z
        </text>
      )}
    </svg>
  );
}

const MOOD_LABEL: Record<AvatarMood, string> = {
  idle: "waiting for you",
  happy: "pleased",
  celebrate: "celebrating",
  reading: "reading",
  exercise: "working out",
  sleep: "asleep",
};
