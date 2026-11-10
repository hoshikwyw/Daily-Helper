"use client";

import { DEFAULT_AVATAR, avatarLabel, type AvatarId, type AvatarMood } from "@/lib/scene";
import { AvatarFigure, MOOD_LABEL } from "./avatar-figure";

type AvatarSpriteProps = {
  avatar?: AvatarId;
  mood?: AvatarMood;
  /** Rendered width in CSS pixels; height follows. */
  size?: number;
  className?: string;
  /** Replaces the default "Your Sprout, …" label, e.g. inside a picker. */
  label?: string;
};

/** An avatar on its own, for cards and pickers outside the room. */
export function AvatarSprite({
  avatar = DEFAULT_AVATAR,
  mood = "idle",
  size = 96,
  className = "",
  label,
}: AvatarSpriteProps) {
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      role="img"
      aria-label={label ?? `Your ${avatarLabel(avatar)}, ${MOOD_LABEL[mood]}`}
      className={className}
    >
      <AvatarFigure avatar={avatar} mood={mood} />
    </svg>
  );
}
