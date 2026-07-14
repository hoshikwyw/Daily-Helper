import { GradientBackground, GridPattern } from "@kwyw/kayv-glass-ui";

// Centered full-screen shell for the signed-out auth pages (login, password
// reset). Shared so the background + grid treatment stays identical.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]"
        squares={[[1, 1], [4, 3], [7, 2]]}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
