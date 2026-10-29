// Small text helpers shared by the UI and the image exporter.

/**
 * A count with its noun, e.g. `plural(1, "entry", "entries")` → "1 entry" and
 * `plural(3, "day")` → "3 days". Pass the plural form when it is not just an
 * added "s".
 */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
