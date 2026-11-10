"use client";

import type { UnlockKey } from "@/lib/unlocks";

// The decorations a rising level adds to the room, each a small group in room
// coordinates (320×240) with a title so it is announced like the furniture.

const BULB_COLORS = ["#F9C9B0", "#FFF0C2", "#AFC9E8", "#C9B8E8", "#B7C9A8"];
const BULB_XS = [20, 44, 68, 92, 116, 140, 164, 188, 212];

/** Where the cord hangs at x: two gentle sags between the wall's hooks. */
function cordY(x: number): number {
  return 16 + 6 * Math.sin((x / 232) * Math.PI * 2 + 0.4);
}

function FairyLights({ night }: { night: boolean }) {
  return (
    <g>
      <title>Fairy lights</title>
      <path d="M6 14 Q 64 26 122 14 T 238 14" stroke="#6B7280" strokeWidth="1.2" fill="none" opacity="0.7" />
      {BULB_XS.map((x, i) => {
        const y = cordY(x);
        const color = BULB_COLORS[i % BULB_COLORS.length];
        return (
          <g key={x}>
            {night && <circle cx={x} cy={y + 2} r="6" fill={color} opacity="0.35" />}
            <line x1={x} y1={y - 2} x2={x} y2={y + 1} stroke="#6B7280" strokeWidth="1" />
            <circle cx={x} cy={y + 3} r="2.4" fill={color} opacity={night ? 1 : 0.9} />
          </g>
        );
      })}
    </g>
  );
}

function Cat() {
  // Curled up on the blanket, eyes closed whatever the hour.
  return (
    <g transform="translate(70 170)">
      <title>A cat, asleep on the bed</title>
      <ellipse cx="22" cy="14" rx="17" ry="9" fill="#E8D3B0" />
      <path d="M36 12 C 44 6, 46 16, 38 19" stroke="#D6BC90" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="9" r="7" fill="#E8D3B0" />
      <path d="M2 5 L3 -1 L8 3 Z" fill="#E8D3B0" />
      <path d="M14 5 L13 -1 L8 3 Z" fill="#E8D3B0" />
      <path d="M3 5 L4 1 L7 4 Z" fill="#F9C9B0" />
      <path d="M13 5 L12 1 L9 4 Z" fill="#F9C9B0" />
      <path d="M4 9 q2 1.5 4 0" stroke="#6B7280" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M9 9 q2 1.5 4 0" stroke="#6B7280" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M18 8 q3 -2 6 0" stroke="#D6BC90" strokeWidth="1.5" fill="none" />
      <path d="M24 7 q3 -2 6 0" stroke="#D6BC90" strokeWidth="1.5" fill="none" />
    </g>
  );
}

function Globe() {
  // On the desk, between the laptop and the lamp.
  return (
    <g transform="translate(254 160)">
      <title>Desk globe</title>
      <rect x="-5" y="9" width="10" height="3" rx="1.5" fill="#6B7280" />
      <path d="M-7 8 A 7.5 7.5 0 0 0 7 8" stroke="#6B7280" strokeWidth="1.2" fill="none" />
      <circle cx="0" cy="1" r="6.5" fill="#AFC9E8" />
      <path d="M-4 -2 C -1 -4, 2 -3, 3 0 C 1 2, -2 2, -4 -2 Z" fill="#B7C9A8" />
      <path d="M1 3 C 3 2, 5 3, 4 5 C 2 6, 1 5, 1 3 Z" fill="#B7C9A8" />
      <circle cx="0" cy="1" r="6.5" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.15" />
    </g>
  );
}

/** Decorations drawn on the wall and furniture, behind the avatar. */
export function RoomDecor({ unlocked, night }: { unlocked: UnlockKey[]; night: boolean }) {
  const has = (key: UnlockKey) => unlocked.includes(key);
  return (
    <>
      {has("lights") && <FairyLights night={night} />}
      {has("cat") && <Cat />}
      {has("globe") && <Globe />}
    </>
  );
}
