# Asset credits

Everything My World draws is original vector art written as SVG in this repository
(`components/game/sprout.tsx`, `components/game/room-scene.tsx`, `components/game/sparkles.tsx`).
It is covered by the project's own licence; nothing is copied from a third-party pack.

## Why no sprite pack

The avatar had to exist before any pack was chosen, and it came out as a small vector
sprout. Pixel-art furniture at 16×16 next to a vector character reads as two games in one
frame, and the brief asks for one consistent style. Drawing the room in the same vector
hand keeps that style, costs a few kilobytes, scales to any screen with no image requests,
and cannot fail to load, so no fallback image is needed. It also avoids attribution and
licence tracking for the first release.

## Packs evaluated, kept as options

All CC0 (public domain dedication), so any of them can be adopted later without
attribution, though credit is still good manners:

- Kenney, **Roguelike Indoors**: 16×16 interior tiles (tables, chairs, sofas, kitchen).
  https://opengameart.org/content/roguelike-indoor-pack
- Kenney, **Roguelike/RPG pack**: 1,700+ 16×16 tiles including bed, bookcase, windows, doors.
  https://opengameart.org/content/roguelikerpg-pack-1700-tiles
- Kenney, **Tiny Dungeon**: 130+ sprites including small characters.
  https://opengameart.org/content/tiny-dungeon

Looked at and not used because the licence is not CC0: DayOff (Lite is non-commercial
only), Pixel Indoor Pack Apartment (custom licence), Cozy People (no idle frames).

## Adding an asset

Record the file name, the source URL, the licence, and any required attribution text
here before the file lands in `public/game/`. Prefer CC0; read the full licence of
anything else before use.
