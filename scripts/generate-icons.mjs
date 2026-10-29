// Renders every icon, favicon, and splash screen the app ships from two SVG
// sources: assets/icon.svg (full-bleed app icon) and assets/logo.svg (the
// mark alone, transparent). Run with `npm run icons` after changing either.
//
// Output:
//   assets/icon-only.png, icon-foreground.png, icon-background.png, splash*.png
//   app/icon.png, app/apple-icon.png, app/favicon.ico   (Next links these itself)
//   public/icons/*.png                                   (web manifest)
//   android/app/src/main/res/**                          (launcher + splash)
//   ios/App/App/Assets.xcassets/**                       (app icon + splash)
//
// The Android/iOS part mirrors what `@capacitor/assets generate` writes, at
// the same sizes and paths. That tool is not used because it pins an older
// sharp whose native binary pnpm never built here.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    // pnpm keeps Next's sharp in the store rather than hoisting it.
    const store = path.join(process.cwd(), "node_modules", ".pnpm");
    const hit = fs
      .readdirSync(store)
      .filter((d) => /^sharp@0\.3[4-9]|^sharp@0\.[4-9]|^sharp@[1-9]/.test(d))
      .sort()
      .pop();
    if (!hit) throw new Error("sharp not found: run `npm install sharp --no-save`");
    const entry = path.join(store, hit, "node_modules", "sharp", "lib", "index.js");
    return (await import(pathToFileURL(entry).href)).default;
  }
}
const sharp = await loadSharp();

const BG = "#0a0a10";

const icon = (size) => sharp("assets/icon.svg").resize(size, size).png();
const logo = (size) => sharp("assets/logo.svg").resize(size, size).png().toBuffer();

// The icon's background on its own (glow, no mark): the adaptive icon's
// background layer, and the canvas behind the splash and maskable icons.
const backdropSvg = (size) =>
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#4c3fa8" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="${BG}"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
</svg>`);

/** Backdrop with the mark centred and scaled to `fraction` of the canvas. */
async function markOnBackdrop(size, fraction) {
  const markSize = Math.round(size * fraction);
  const mark = await logo(markSize);
  const offset = Math.round((size - markSize) / 2);
  return sharp(backdropSvg(size)).composite([{ input: mark, left: offset, top: offset }]).png();
}

/** A Windows ICO holding PNG-encoded images (supported since Vista). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buf } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buf.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

const circle = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );

async function web() {
  fs.mkdirSync("public/icons", { recursive: true });

  await icon(1024).toFile("assets/icon-only.png");
  await sharp(backdropSvg(1024)).png().toFile("assets/icon-background.png");
  await sharp("assets/logo.svg").resize(1024, 1024).png().toFile("assets/icon-foreground.png");
  const splash = await markOnBackdrop(2732, 0.28);
  await splash.clone().toFile("assets/splash.png");
  await splash.clone().toFile("assets/splash-dark.png");

  await icon(512).toFile("app/icon.png");
  await icon(180).toFile("app/apple-icon.png");
  const favicons = [];
  for (const size of [16, 32, 48]) favicons.push({ size, buf: await icon(size).toBuffer() });
  fs.writeFileSync("app/favicon.ico", ico(favicons));

  for (const size of [48, 72, 96, 128, 192, 256, 512]) {
    await icon(size).toFile(`public/icons/icon-${size}.png`);
  }
  // Maskable: the mark kept inside the 80% safe circle so no OS mask clips it.
  await (await markOnBackdrop(512, 0.7)).toFile("public/icons/icon-maskable-512.png");
}

async function native() {
  const RES = "android/app/src/main/res";
  const LAUNCHER = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const ADAPTIVE = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
  const SPLASH_LAND = {
    ldpi: [320, 240],
    mdpi: [480, 320],
    hdpi: [800, 480],
    xhdpi: [1280, 720],
    xxhdpi: [1600, 960],
    xxxhdpi: [1920, 1280],
  };
  const splash = (w, h) => sharp("assets/splash.png").resize(w, h, { fit: "cover" }).png();

  for (const [dpi, size] of Object.entries(LAUNCHER)) {
    await sharp("assets/icon-only.png").resize(size, size).png().toFile(`${RES}/mipmap-${dpi}/ic_launcher.png`);
    await sharp("assets/icon-only.png")
      .resize(size, size)
      .composite([{ input: circle(size), blend: "dest-in" }])
      .png()
      .toFile(`${RES}/mipmap-${dpi}/ic_launcher_round.png`);
  }
  for (const [dpi, size] of Object.entries(ADAPTIVE)) {
    await sharp("assets/icon-foreground.png").resize(size, size).png().toFile(`${RES}/mipmap-${dpi}/ic_launcher_foreground.png`);
    await sharp("assets/icon-background.png").resize(size, size).png().toFile(`${RES}/mipmap-${dpi}/ic_launcher_background.png`);
  }

  await splash(320, 480).toFile(`${RES}/drawable/splash.png`);
  await splash(320, 240).toFile(`${RES}/drawable-night/splash.png`);
  for (const [dpi, [w, h]] of Object.entries(SPLASH_LAND)) {
    for (const night of ["", "-night"]) {
      await splash(w, h).toFile(`${RES}/drawable-land${night}-${dpi}/splash.png`);
      await splash(h, w).toFile(`${RES}/drawable-port${night}-${dpi}/splash.png`);
    }
  }

  const IOS = "ios/App/App/Assets.xcassets";
  await sharp("assets/icon-only.png")
    .resize(1024, 1024)
    .flatten({ background: BG })
    .png()
    .toFile(`${IOS}/AppIcon.appiconset/AppIcon-512@2x.png`);
  const iosSplash = [
    "Default@1x~universal~anyany.png",
    "Default@2x~universal~anyany.png",
    "Default@3x~universal~anyany.png",
    "Default@1x~universal~anyany-dark.png",
    "Default@2x~universal~anyany-dark.png",
    "Default@3x~universal~anyany-dark.png",
    "splash-2732x2732.png",
    "splash-2732x2732-1.png",
    "splash-2732x2732-2.png",
  ];
  for (const name of iosSplash) await splash(2732, 2732).toFile(`${IOS}/Splash.imageset/${name}`);
}

await web();
await native();
console.log("Icons, favicon, manifest icons, and native splash screens regenerated.");
