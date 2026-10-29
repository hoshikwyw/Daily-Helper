// Small text helpers shared by the UI and the image exporter.

/**
 * A count with its noun, e.g. `plural(1, "entry", "entries")` → "1 entry" and
 * `plural(3, "day")` → "3 days". Pass the plural form when it is not just an
 * added "s".
 */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * How many user-perceived characters a string has. An emoji such as a
 * flag, a skin-tone variant, or a family is several code points but one
 * grapheme; `length` and `Array.from` both overcount it. Falls back to code
 * points where `Intl.Segmenter` is unavailable.
 */
export function graphemeCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter().segment(text)].length;
  }
  return Array.from(text).length;
}
