import { Breadcrumb } from "@kwyw/kayv-glass-ui";

// Standard page heading: optional breadcrumb, then title + subtitle on the
// left with an optional actions slot on the right.
//
// The title carries the weight through size and tight tracking rather than a
// heavy font, and a hairline rule separates the header from the content so the
// eye knows where the page proper begins.

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="relative space-y-4 border-b border-white/8 pb-5">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
