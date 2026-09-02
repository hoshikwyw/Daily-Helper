// Full-screen placeholders. Both were inlined as bare divs in five places.

/**
 * Shown while auth or a lazily-loaded shell resolves — a pulsing glass panel,
 * so the wait reads as "loading" rather than "broken".
 */
export function PageLoader() {
  return <div className="min-h-screen animate-pulse bg-white/5" />;
}

/**
 * Flat app background for routes that only redirect. Deliberately static: a
 * pulse would imply content is coming, when the page is really just handing
 * off to another route.
 */
export function PageBackdrop() {
  return <div className="min-h-screen bg-[#0a0a0a]" />;
}
