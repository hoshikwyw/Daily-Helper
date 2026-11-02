import { GradientBackground } from "@kwyw/kayv-glass-ui";

// Centered full-screen shell for the signed-out pages (login, password reset).
// Matches PageContainer: one muted gradient, no dot-grid overlay on top of it.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <GradientBackground fixed={false} className="opacity-25" />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
