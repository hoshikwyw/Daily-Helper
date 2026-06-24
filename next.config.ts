import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — produces an `out/` folder of HTML/CSS/JS that Capacitor
  // packages into the native Android/iOS apps. No Node server at runtime.
  output: "export",
  // next/image optimization needs a server; disable it for the static bundle.
  images: { unoptimized: true },
};

export default nextConfig;
