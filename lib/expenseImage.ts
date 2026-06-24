// Renders a "cute" expense summary card to a PNG and triggers a download.
// Uses the Canvas 2D API directly so it needs no external dependency and works
// fully offline. Call only on the client (it touches document/canvas).

export interface ExpenseImageCategory {
  category: string;
  amount: string; // pre-formatted, e.g. "K 1,200"
  pct: number;
  color: string; // hex, e.g. "#f97316"
}

export interface ExpenseImageData {
  periodLabel: string; // "Daily" | "Monthly" | "Yearly"
  title: string; // "May 27, 2026" | "May 2026" | "2026"
  subtitle?: string; // optional small line under the title
  total: string; // pre-formatted total, e.g. "K 12,345"
  entries: number;
  categories: ExpenseImageCategory[];
  accent?: string; // hex accent (defaults to violet)
  footerNote?: string;
}

const SCALE = 2; // render at 2x for crisp output

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function lighten(hex: string, amt = 0.55) {
  const { r, g, b } = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const SANS = "'Segoe UI', system-ui, -apple-system, sans-serif";
const EMOJI = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

export function downloadExpenseImage(data: ExpenseImageData, filename: string) {
  const accent = data.accent ?? "#8b5cf6";
  const cats = data.categories.slice(0, 8);

  // --- layout constants ---
  const W = 1080;
  const M = 36; // transparent outer margin (gives rounded-corner cutout)
  const PAD = 60; // inner card padding
  const ROW = 64; // category row height
  const BADGE_H = 44;

  // --- height computation (must match the draw increments below) ---
  const headerH = BADGE_H + 30 + 56 + (data.subtitle ? 40 : 0) + 24;
  const totalH = 40 + 90 + 30;
  const catsH = cats.length ? 40 + cats.length * ROW : 70;
  const footerH = 96;
  const innerH = headerH + totalH + catsH + footerH;
  const H = innerH + M * 2 + PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(SCALE, SCALE);
  ctx.clearRect(0, 0, W, H);

  const cx = M;
  const cy = M;
  const cw = W - M * 2;
  const ch = H - M * 2;

  // --- card background ---
  roundRect(ctx, cx, cy, cw, ch, 48);
  const bg = ctx.createLinearGradient(0, cy, 0, cy + ch);
  bg.addColorStop(0, "#1c1430");
  bg.addColorStop(1, "#0c0c16");
  ctx.fillStyle = bg;
  ctx.fill();

  // --- accent glow (clipped to card) ---
  ctx.save();
  roundRect(ctx, cx, cy, cw, ch, 48);
  ctx.clip();
  const glow = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, cw * 0.75);
  glow.addColorStop(0, rgba(accent, 0.3));
  glow.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.restore();

  // --- cute gradient border ---
  roundRect(ctx, cx + 8, cy + 8, cw - 16, ch - 16, 40);
  const border = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  border.addColorStop(0, rgba(accent, 0.9));
  border.addColorStop(0.5, rgba("#ec4899", 0.7));
  border.addColorStop(1, rgba("#38bdf8", 0.85));
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- corner decorations ---
  ctx.font = `30px ${EMOJI}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 0.9;
  ctx.fillText("✨", cx + cw - 72, cy + 66);
  ctx.fillText("🪙", cx + 40, cy + ch - 38);
  ctx.globalAlpha = 1;

  const left = cx + PAD;
  const right = cx + cw - PAD;
  const innerW = right - left;
  let y = cy + PAD;

  // --- period badge ---
  const badgeText = data.periodLabel.toUpperCase();
  ctx.font = `600 22px ${SANS}`;
  const badgeW = ctx.measureText(badgeText).width + 64;
  roundRect(ctx, left, y, badgeW, BADGE_H, 22);
  ctx.fillStyle = rgba(accent, 0.18);
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.font = `20px ${EMOJI}`;
  ctx.fillText("💰", left + 16, y + BADGE_H / 2 + 1);
  ctx.font = `600 22px ${SANS}`;
  ctx.fillStyle = lighten(accent);
  ctx.fillText(badgeText, left + 46, y + BADGE_H / 2 + 1);
  ctx.textBaseline = "alphabetic";
  y += BADGE_H + 30;

  // --- title ---
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 52px ${SANS}`;
  ctx.textAlign = "left";
  ctx.fillText(data.title, left, y + 42);
  y += 56;

  // --- subtitle ---
  if (data.subtitle) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText(data.subtitle, left, y + 24);
    y += 40;
  }
  y += 24;

  // --- total ---
  ctx.fillStyle = "#64748b";
  ctx.font = `600 22px ${SANS}`;
  ctx.fillText("TOTAL SPENT", left, y + 16);
  y += 40;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 72px ${SANS}`;
  ctx.fillText(data.total, left, y + 58);
  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText(`${data.entries} ${data.entries === 1 ? "entry" : "entries"}`, right, y + 52);
  ctx.textAlign = "left";
  y += 90;

  // --- divider ---
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 30;

  // --- categories ---
  if (cats.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = `600 20px ${SANS}`;
    ctx.fillText("BY CATEGORY", left, y + 14);
    y += 40;

    for (const c of cats) {
      ctx.beginPath();
      ctx.arc(left + 8, y + 13, 8, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `500 26px ${SANS}`;
      ctx.textAlign = "left";
      ctx.fillText(c.category, left + 30, y + 22);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 26px ${SANS}`;
      ctx.fillText(`${c.amount}  ·  ${c.pct}%`, right, y + 22);
      ctx.textAlign = "left";

      const barY = y + 38;
      roundRect(ctx, left, barY, innerW, 10, 5);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fill();
      const fillW = Math.max(10, (innerW * Math.min(100, Math.max(0, c.pct))) / 100);
      roundRect(ctx, left, barY, fillW, 10, 5);
      ctx.fillStyle = c.color;
      ctx.fill();

      y += ROW;
    }
  } else {
    ctx.fillStyle = "#64748b";
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText("No expenses in this period.", left, y + 24);
  }

  // --- footer ---
  const fy = cy + ch - PAD - 6;
  ctx.fillStyle = rgba(accent, 0.95);
  ctx.font = `700 26px ${SANS}`;
  ctx.textAlign = "left";
  ctx.fillText("✦ Kayv", left, fy);
  ctx.fillStyle = "#475569";
  ctx.font = `400 20px ${SANS}`;
  ctx.textAlign = "right";
  ctx.fillText(data.footerNote ?? "Expense report", right, fy - 2);
  ctx.textAlign = "left";

  // --- download ---
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}
