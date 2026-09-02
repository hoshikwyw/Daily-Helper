// Completion math shared by anything that renders a progress bar — project
// task rollups, the Today page's daily completion. Kept domain-neutral so no
// feature has to import another feature's module just to draw a bar.

/** Percentage complete, rounded; 0 when there is nothing to measure. */
export function progressPercent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Bars and badges turn green only at a genuine 100%. */
export function progressVariant(percent: number): "success" | "primary" {
  return percent === 100 ? "success" : "primary";
}
