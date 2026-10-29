import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

// Geist ships as an npm package with the font files bundled, rather than
// `next/font/google`, which downloads them from Google Fonts during the build.
// That fetch fails on any network where Google is blocked or offline, taking
// the whole build with it — including the Capacitor mobile builds. These
// expose the same --font-geist-sans / --font-geist-mono variables globals.css
// already relies on, so the rendered type is unchanged.

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page extend under the notch and home indicator, which is what
  // makes env(safe-area-inset-*) resolve to real values in the native shell.
  // Zoom is deliberately left enabled — pinch-to-zoom is an accessibility need.
  viewportFit: "cover",
  themeColor: "#0a0a10",
};

// The favicon, PWA icon, and Apple touch icon are the metadata files beside
// this layout (favicon.ico, icon.png, apple-icon.png); Next links them itself.
// All of them render from assets/icon.svg — regenerate rather than hand-edit.
export const metadata: Metadata = {
  title: "Kayv",
  description:
    "Your personal life management dashboard: tasks, journal, projects, and money in one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kayv", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
