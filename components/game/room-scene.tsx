"use client";

import type { SceneState } from "./scene-state";
import { AvatarSprite } from "./avatar-sprite";

type RoomSceneProps = {
  state: SceneState;
};

/**
 * The cozy room, as plain elements. Wall and floor are gradients; the
 * furniture is soft blocks in the pastel palette until the sprite pack
 * replaces them. Each object is a labelled element, so a screen reader hears
 * the room and later each can open its own unlock details.
 */
export function RoomScene({ state }: RoomSceneProps) {
  const night = state.timeOfDay === "night";
  return (
    <div
      role="group"
      aria-label={night ? "Your room at night" : "Your room"}
      className={`game-room relative w-full overflow-hidden rounded-2xl border border-white/10 select-none ${night ? "game-room-night" : ""}`}
      style={{ aspectRatio: "4 / 3" }}
    >
      {/* wall and floor */}
      <div className="absolute inset-x-0 top-0 h-[62%] game-wall" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] game-floor" />
      <div className="absolute inset-x-0 top-[62%] h-[3px] bg-black/15" />

      {/* window */}
      <div
        role="img"
        aria-label={night ? "Window, stars outside" : "Window, daylight outside"}
        title="Window"
        className="absolute left-[8%] top-[12%] h-[30%] w-[22%] rounded-lg border-[3px] border-[#FFF6E5]/90 game-window"
      >
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#FFF6E5]/90" />
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#FFF6E5]/90" />
      </div>

      {/* bookshelf */}
      <div
        role="img"
        aria-label="Bookshelf"
        title="Bookshelf"
        className="absolute right-[8%] top-[18%] h-[44%] w-[18%] rounded-md bg-[#C9B8E8] shadow-[inset_0_-6px_0_rgba(0,0,0,0.08)]"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="absolute inset-x-[10%] flex gap-[6%]" style={{ top: `${14 + row * 28}%`, height: "18%" }}>
            <span className="flex-1 rounded-sm bg-[#AFC9E8]" />
            <span className="flex-1 rounded-sm bg-[#F9C9B0]" />
            <span className="flex-1 rounded-sm bg-[#B7C9A8]" />
          </div>
        ))}
      </div>

      {/* bed */}
      <div
        role="img"
        aria-label="Bed"
        title="Bed"
        className="absolute left-[6%] bottom-[14%] h-[22%] w-[30%] rounded-xl bg-[#F9C9B0] shadow-[inset_0_-8px_0_rgba(0,0,0,0.08)]"
      >
        <div className="absolute left-[8%] top-[18%] h-[30%] w-[26%] rounded-md bg-[#FFF6E5]" />
        <div className="absolute right-[6%] top-[22%] h-[60%] w-[55%] rounded-md bg-[#C9B8E8]/80" />
      </div>

      {/* desk with a book */}
      <div
        role="img"
        aria-label="Desk"
        title="Desk"
        className="absolute right-[10%] bottom-[18%] h-[14%] w-[26%] rounded-md bg-[#E3C9A6] shadow-[inset_0_-6px_0_rgba(0,0,0,0.1)]"
      >
        <div className="absolute left-[12%] -top-[22%] h-[26%] w-[28%] rounded-sm bg-[#AFC9E8]" />
      </div>

      {/* plant */}
      <div role="img" aria-label="Plant" title="Plant" className="absolute right-[40%] bottom-[16%] w-[8%]">
        <div className="mx-auto h-0 w-full pb-[100%] rounded-full bg-[#8FAE82]" />
        <div className="mx-auto -mt-[20%] h-0 w-[70%] pb-[40%] rounded-b-md bg-[#E3C9A6]" />
      </div>

      {/* the avatar stands on the floor */}
      <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[20%] min-w-[64px] max-w-[112px]">
        <AvatarSprite mood={state.mood} size={112} className="h-auto w-full" />
      </div>
    </div>
  );
}
