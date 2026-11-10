"use client";

import { useId } from "react";
import { avatarLabel, sparklesFor, type SceneState } from "@/lib/scene";
import { AvatarFigure, MOOD_LABEL } from "./avatar-figure";
import { RoomDecor } from "./room-decor";
import { Sparkles } from "./sparkles";

type RoomSceneProps = {
  state: SceneState;
  /** Changes with each reward so the sparkle burst restarts. */
  burstKey?: number;
};

// The avatar's 64×72 box sits here in room coordinates: feet on the floor,
// centred on the rug.
const AVATAR_X = 128;
const AVATAR_Y = 150;

/**
 * The cozy room as one SVG. Everything is vector, drawn in the pastel
 * palette, so it is crisp at any size, weighs a few kilobytes, and can never
 * fail to load. The svg is a group, not an image, so each piece of
 * furniture's title is announced on its own; later each can open its own
 * unlock details.
 */
export function RoomScene({ state, burstKey = 0 }: RoomSceneProps) {
  const night = state.timeOfDay === "night";
  // Gradient ids are document-wide; two rooms on one page must not share them.
  const id = useId();
  const g = (name: string) => `${id}-${name}`;
  return (
    <svg
      viewBox="0 0 320 240"
      role="group"
      aria-label={`${night ? "Your room at night" : "Your room"}. Your ${avatarLabel(state.avatar)} is ${MOOD_LABEL[state.mood]}.`}
      className="block w-full h-auto rounded-2xl border border-white/10 select-none"
    >
      <defs>
        <linearGradient id={g("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#3B3660" : "#EADDF6"} />
          <stop offset="1" stopColor={night ? "#2C2A4A" : "#D8CBF0"} />
        </linearGradient>
        <linearGradient id={g("floor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#5A4A3B" : "#EACFAE"} />
          <stop offset="1" stopColor={night ? "#453A2F" : "#D9B98F"} />
        </linearGradient>
        <linearGradient id={g("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#1F2A44" : "#BCD6F2"} />
          <stop offset="1" stopColor={night ? "#2B3A5C" : "#DCE9F7"} />
        </linearGradient>
        <radialGradient id={g("lamp-glow")}>
          <stop offset="0" stopColor="#FFF0C2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF0C2" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* wall, skirting, floor */}
      <rect x="0" y="0" width="320" height="150" fill={`url(#${g("wall")})`} />
      <rect x="0" y="150" width="320" height="90" fill={`url(#${g("floor")})`} />
      <rect x="0" y="148" width="320" height="4" fill="#000" opacity="0.12" />
      {/* floorboards */}
      {[172, 194, 216].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#000" opacity="0.06" />
      ))}

      {/* rug */}
      <ellipse cx="160" cy="212" rx="78" ry="20" fill="#C9B8E8" opacity={night ? 0.5 : 0.8} />
      <ellipse cx="160" cy="212" rx="60" ry="13" fill="#FFF6E5" opacity={night ? 0.25 : 0.5} />

      {/* window */}
      <g>
        <title>Window</title>
        <rect x="26" y="26" width="78" height="66" rx="7" fill="#FFF6E5" opacity={night ? 0.8 : 1} />
        <rect x="32" y="32" width="66" height="54" rx="4" fill={`url(#${g("sky")})`} />
        {night ? (
          <>
            <circle cx="50" cy="46" r="1.4" fill="#FFF6E5" />
            <circle cx="74" cy="40" r="1" fill="#FFF6E5" />
            <circle cx="86" cy="56" r="1.2" fill="#FFF6E5" />
            <circle cx="60" cy="66" r="0.9" fill="#FFF6E5" />
            <circle cx="80" cy="74" r="6" fill="#FFF6E5" opacity="0.9" />
            <circle cx="83" cy="72" r="5.2" fill="#2B3A5C" />
          </>
        ) : (
          <>
            <circle cx="80" cy="46" r="7" fill="#FFF0C2" />
            <ellipse cx="52" cy="62" rx="12" ry="5" fill="#FFF6E5" opacity="0.9" />
            <ellipse cx="62" cy="58" rx="8" ry="4" fill="#FFF6E5" opacity="0.9" />
          </>
        )}
        <rect x="64" y="32" width="3" height="54" fill="#FFF6E5" opacity="0.95" />
        <rect x="32" y="57" width="66" height="3" fill="#FFF6E5" opacity="0.95" />
      </g>

      {/* picture frame */}
      <g>
        <title>Picture</title>
        <rect x="136" y="40" width="46" height="36" rx="4" fill="#E3C9A6" />
        <rect x="141" y="45" width="36" height="26" rx="2" fill="#DCE9D2" />
        <circle cx="159" cy="60" r="6" fill="#B7C9A8" />
        <path d="M159 54 C 158 49, 163 48, 165 51 C 163 52, 161 53, 159 54 Z" fill="#8FAE82" />
      </g>

      {/* bookshelf */}
      <g>
        <title>Bookshelf</title>
        <rect x="236" y="44" width="62" height="106" rx="4" fill="#C9B8E8" />
        {[0, 1, 2].map((row) => {
          const y = 54 + row * 32;
          return (
            <g key={row}>
              <rect x="241" y={y + 22} width="52" height="3" fill="#000" opacity="0.12" />
              <rect x="243" y={y} width="9" height="22" rx="1.5" fill="#AFC9E8" />
              <rect x="254" y={y + 3} width="8" height="19" rx="1.5" fill="#F9C9B0" />
              <rect x="264" y={y + 1} width="10" height="21" rx="1.5" fill="#B7C9A8" />
              <rect x="276" y={y + 5} width="7" height="17" rx="1.5" fill="#FFF6E5" />
              {row === 1 && <circle cx="289" cy={y + 17} r="4.5" fill="#8FAE82" />}
            </g>
          );
        })}
      </g>

      {/* bed */}
      <g>
        <title>Bed</title>
        <rect x="18" y="152" width="98" height="12" rx="4" fill="#E3C9A6" />
        <rect x="18" y="160" width="98" height="46" rx="8" fill="#F9C9B0" />
        <rect x="26" y="166" width="28" height="16" rx="5" fill="#FFF6E5" />
        <rect x="58" y="166" width="54" height="36" rx="6" fill="#C9B8E8" />
        <rect x="58" y="166" width="54" height="8" rx="3" fill="#FFF6E5" opacity="0.6" />
        <rect x="22" y="204" width="8" height="10" rx="2" fill="#D9B98F" />
        <rect x="104" y="204" width="8" height="10" rx="2" fill="#D9B98F" />
      </g>

      {/* desk, book, lamp */}
      <g>
        <title>Desk</title>
        {night && <circle cx="278" cy="150" r="46" fill={`url(#${g("lamp-glow")})`} />}
        <rect x="206" y="172" width="92" height="10" rx="3" fill="#E3C9A6" />
        <rect x="212" y="182" width="8" height="30" rx="2" fill="#D9B98F" />
        <rect x="284" y="182" width="8" height="30" rx="2" fill="#D9B98F" />
        <rect x="222" y="164" width="22" height="8" rx="1.5" fill="#AFC9E8" />
        <rect x="222" y="162" width="22" height="3" rx="1" fill="#FFF6E5" />
        <rect x="276" y="146" width="3" height="26" fill="#6B7280" />
        <path d="M264 148 L292 148 L286 134 L270 134 Z" fill="#F9C9B0" />
        {night && <ellipse cx="278" cy="150" rx="12" ry="3" fill="#FFF0C2" opacity="0.6" />}
      </g>

      {/* plant */}
      <g>
        <title>Plant</title>
        <rect x="178" y="190" width="20" height="18" rx="3" fill="#E3C9A6" />
        <rect x="176" y="188" width="24" height="5" rx="2" fill="#D9B98F" />
        <circle cx="182" cy="180" r="9" fill="#8FAE82" />
        <circle cx="196" cy="178" r="9" fill="#B7C9A8" />
        <circle cx="189" cy="170" r="9" fill="#8FAE82" />
      </g>

      {/* what the level has added */}
      <RoomDecor unlocked={state.unlocked} night={night} />

      {/* night dims the room, lamp light excepted */}
      {night && <rect x="0" y="0" width="320" height="240" fill="#1F1B3A" opacity="0.18" />}

      {/* The avatar, feet on the rug. Keyed by the burst so a repeated
          reaction remounts it and its hop plays again. */}
      <g key={burstKey} transform={`translate(${AVATAR_X} ${AVATAR_Y})`}>
        <ellipse cx="32" cy="72" rx="20" ry="4" fill="#000" opacity="0.12" />
        <AvatarFigure avatar={state.avatar} mood={state.mood} />
      </g>
      {sparklesFor(state.mood) && <Sparkles key={burstKey} cx={AVATAR_X + 32} cy={AVATAR_Y + 40} />}
    </svg>
  );
}
