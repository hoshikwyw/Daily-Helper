import { GradientBackground } from "@kwyw/kayv-glass-ui";

// The shared page frame: a padded column with the app's gradient behind it.
//
// The gradient is heavily muted and the dot-grid overlay that used to sit on
// top of it is gone. Two animated textures stacked behind every card competed
// with the content for attention and added nothing you could read — muting one
// and dropping the other is most of what makes the app feel calmer.

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`relative min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      <GradientBackground fixed={false} className="opacity-25" />
      {children}
    </div>
  );
}
