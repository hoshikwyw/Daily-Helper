import { Capacitor } from "@capacitor/core";

// The custom URL scheme registered in AndroidManifest.xml and iOS Info.plist.
// Supabase email links (password reset, etc.) redirect here on native so the
// OS reopens the app instead of a system browser.
export const APP_SCHEME = "kayv";

// Returns the redirect URL Supabase should send the user back to after an
// email link. On native it's a custom-scheme deep link; on web it's the
// regular https origin + /auth/callback.
export function authCallbackUrl(next: string): string {
  const query = `?next=${encodeURIComponent(next)}`;
  if (Capacitor.isNativePlatform()) {
    return `${APP_SCHEME}://auth/callback${query}`;
  }
  return `${window.location.origin}/auth/callback${query}`;
}
