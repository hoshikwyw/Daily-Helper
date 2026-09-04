import { Breadcrumb } from "@kwyw/kayv-glass-ui";

// Standard page heading: optional breadcrumb, then title + subtitle on the
// left with an optional actions slot on the right.
//
// The title carries weight through size and tight tracking rather than a heavy
// font, and a hairline rule separates the header from the content.
//
// Mobile behaviour: actions drop to their own full-width row and share it
// equally. Squeezed beside a title they were cramped and easy to mis-tap, and
// the primary action of a screen deserves a proper target on a phone.

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="relative space-y-4 border-b border-white/8 pb-4 sm:pb-5">
      {/* A long trail (project names) scrolls rather than wrapping the layout. */}
      {breadcrumb && (
        <div className="scroll-x">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
            {title}
          </h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
