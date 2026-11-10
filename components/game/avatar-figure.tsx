"use client";

import type { AvatarId, AvatarMood } from "@/lib/scene";

type AvatarFigureProps = {
  avatar: AvatarId;
  mood: AvatarMood;
};

// Each starter shares one body and face so every mood, prop, and animation
// works for all of them; what differs is the colouring and what grows on top.
const PALETTE: Record<AvatarId, { body: string; belly: string }> = {
  sprout: { body: "#CFE0C3", belly: "#DCE9D2" },
  bloom: { body: "#F9D5C4", belly: "#FCE4D8" },
  shroom: { body: "#F3E7D3", belly: "#FFF6E5" },
};

const PETAL_ANGLES = [0, 72, 144, 216, 288];

function Crown({ avatar }: { avatar: AvatarId }) {
  switch (avatar) {
    case "sprout":
      return (
        <>
          <path d="M32 14 C 30 4, 40 2, 44 8 C 40 10, 36 12, 32 14 Z" fill="#8FAE82" />
          <path d="M32 14 C 34 6, 24 2, 20 8 C 24 10, 28 12, 32 14 Z" fill="#B7C9A8" />
          <line x1="32" y1="14" x2="32" y2="22" stroke="#8FAE82" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case "bloom":
      return (
        <>
          <line x1="32" y1="14" x2="32" y2="22" stroke="#8FAE82" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 18 C 35 16, 38 17, 39 20 C 36 20, 34 19, 32 18 Z" fill="#B7C9A8" />
          {PETAL_ANGLES.map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={(32 + Math.sin(r) * 5).toFixed(2)}
                cy={(9 - Math.cos(r) * 5).toFixed(2)}
                r="3.6"
                fill="#F4A6B8"
              />
            );
          })}
          <circle cx="32" cy="9" r="2.8" fill="#FFF0C2" />
        </>
      );
    case "shroom":
      return (
        <>
          <path d="M8 25 C 10 4, 54 4, 56 25 Z" fill="#C9B8E8" />
          <circle cx="22" cy="15" r="2.6" fill="#FFF6E5" />
          <circle cx="36" cy="10" r="2" fill="#FFF6E5" />
          <circle cx="44" cy="18" r="2.3" fill="#FFF6E5" />
          <rect x="8" y="23" width="48" height="3" rx="1.5" fill="#B8A5DB" />
        </>
      );
  }
}

/**
 * An avatar as SVG content sized to a 64×72 box with its feet at y=72.
 * Drawn in code so it scales crisply, needs no image request, and shares the
 * room's palette. Use it inside any <svg>; `AvatarSprite` wraps it standalone.
 */
export function AvatarFigure({ avatar, mood }: AvatarFigureProps) {
  const asleep = mood === "sleep";
  const happy = mood === "happy" || mood === "celebrate";
  const colors = PALETTE[avatar];
  return (
    <g className={`game-anim game-avatar game-mood-${mood}`}>
      {/* body */}
      <ellipse cx="32" cy="46" rx="22" ry="24" fill={colors.body} />
      <ellipse cx="32" cy="50" rx="17" ry="17" fill={colors.belly} />
      {/* what grows on top; drawn after the body so a cap sits over the head */}
      <Crown avatar={avatar} />
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
        <path
          d={happy ? "M27 52 q5 5 10 0" : "M29 53 q3 2 6 0"}
          stroke="#6B7280"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
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
    </g>
  );
}

export const MOOD_LABEL: Record<AvatarMood, string> = {
  idle: "waiting for you",
  happy: "pleased",
  celebrate: "celebrating",
  reading: "reading",
  exercise: "working out",
  sleep: "asleep",
};
