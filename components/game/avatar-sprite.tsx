"use client";

import type { AvatarMood } from "@/lib/scene";
import { MOOD_LABEL, SproutFigure } from "./sprout";

type AvatarSpriteProps = {
  mood?: AvatarMood;
  /** Rendered width in CSS pixels; height follows. */
  size?: number;
  className?: string;
};

/** The sprout on its own, for cards and pickers outside the room. */
export function AvatarSprite({ mood = "idle", size = 96, className = "" }: AvatarSpriteProps) {
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      role="img"
      aria-label={`Your sprout, ${MOOD_LABEL[mood]}`}
      className={className}
    >
      <SproutFigure mood={mood} />
    </svg>
  );
}
