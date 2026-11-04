// Hands a piece of text to the system share sheet: Capacitor's plugin inside
// the app, the Web Share API in a browser that has one. Nothing on a desktop
// browser without it, where the caller falls back to the clipboard.

export async function canShareText(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator.share === "function";
}

export type ShareOutcome = "shared" | "dismissed" | "failed";

/**
 * Opens the share sheet. "dismissed" is the person closing it without picking
 * an app, which is not an error; "failed" is everything else and deserves a
 * fallback from the caller.
 */
export async function shareText(title: string, text: string): Promise<ShareOutcome> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, dialogTitle: title });
    } else {
      await navigator.share({ title, text });
    }
    return "shared";
  } catch (err) {
    return isDismissal(err) ? "dismissed" : "failed";
  }
}

// The Web Share API rejects with AbortError; the Capacitor plugin with a
// message containing "cancel" (Android: "Share canceled", iOS: "Share cancelled").
function isDismissal(err: unknown): boolean {
  if (err instanceof DOMException) return err.name === "AbortError";
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message);
}
