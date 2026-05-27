"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MenuBar,
  MenuBarBrand,
  MenuBarSection,
  MenuBarItem,
  MenuBarDivider,
} from "@kwyw/kayv-glass-ui";

const NAV_ITEMS = [
  { value: "home", label: "Today", href: "/dashboard", icon: "☀️" },
  { value: "tasks", label: "Tasks", href: "/dashboard/tasks", icon: "✅" },
  { value: "journal", label: "Journal", href: "/dashboard/journal", icon: "📓" },
  { value: "projects", label: "Projects", href: "/dashboard/projects", icon: "🚀" },
  { value: "expenses", label: "Expenses", href: "/dashboard/expenses", icon: "💰" },
];

const SETTINGS_ITEMS = [
  { value: "settings", label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

function NavIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <span role="img" aria-label={label} className="text-base leading-none">
      {icon}
    </span>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const active =
    NAV_ITEMS.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.value ??
    SETTINGS_ITEMS.find((i) => pathname === i.href)?.value ??
    "home";

  return (
    <div className="flex min-h-screen">
      <MenuBar value={active} display="responsive" className="shrink-0">
        <MenuBarBrand>
          <span className="text-base font-bold text-white">✦ Kayv</span>
        </MenuBarBrand>

        <MenuBarSection label="Main">
          {NAV_ITEMS.map((item) => (
            <Link key={item.value} href={item.href} className="block">
              <MenuBarItem
                value={item.value}
                icon={<NavIcon icon={item.icon} label={item.label} />}
              >
                {item.label}
              </MenuBarItem>
            </Link>
          ))}
        </MenuBarSection>

        <MenuBarDivider />

        <MenuBarSection label="Account">
          {SETTINGS_ITEMS.map((item) => (
            <Link key={item.value} href={item.href} className="block">
              <MenuBarItem
                value={item.value}
                icon={<NavIcon icon={item.icon} label={item.label} />}
              >
                {item.label}
              </MenuBarItem>
            </Link>
          ))}
        </MenuBarSection>
      </MenuBar>

      <main className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
