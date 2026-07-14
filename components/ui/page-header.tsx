import { Breadcrumb } from "@kwyw/kayv-glass-ui";

// Standard page heading: an optional breadcrumb trail, then a title + subtitle
// on the left with an optional actions slot (buttons) on the right. Replaces
// the near-identical header markup copy-pasted into every dashboard page.

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <>
      {breadcrumb && (
        <div className="relative">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}
