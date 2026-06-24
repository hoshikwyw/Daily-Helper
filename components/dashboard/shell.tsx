"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  MenuBar,
  MenuBarBrand,
  MenuBarSection,
  MenuBarItem,
  MenuBarDivider,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";

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

const HREF_BY_VALUE: Record<string, string> = Object.fromEntries(
  [...NAV_ITEMS, ...SETTINGS_ITEMS].map((i) => [i.value, i.href])
);

function NavIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <span role="img" aria-label={label} className="text-base leading-none">
      {icon}
    </span>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Drive navigation centrally so it works in BOTH the sidebar (lg+) and the
  // mobile bottom nav — the bottom nav renders its own buttons that only fire
  // onValueChange, so per-item <Link>/onClick wrappers wouldn't navigate there.
  function handleValueChange(value: string) {
    if (value === "logout") {
      handleLogout();
      return;
    }
    const href = HREF_BY_VALUE[value];
    if (href) router.push(href);
  }

  const active =
    NAV_ITEMS.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.value ??
    SETTINGS_ITEMS.find((i) => pathname === i.href)?.value ??
    "home";

  return (
    <div className="flex min-h-screen">
      <MenuBar
        value={active}
        onValueChange={handleValueChange}
        display="responsive"
        className="shrink-0"
      >
        <MenuBarBrand>
          <span className="text-base font-bold text-white">✦ Kayv</span>
        </MenuBarBrand>

        <MenuBarSection label="Main">
          {NAV_ITEMS.map((item) => (
            <MenuBarItem
              key={item.value}
              value={item.value}
              icon={<NavIcon icon={item.icon} label={item.label} />}
            >
              {item.label}
            </MenuBarItem>
          ))}
        </MenuBarSection>

        <MenuBarDivider />

        <MenuBarSection label="Account">
          {SETTINGS_ITEMS.map((item) => (
            <MenuBarItem
              key={item.value}
              value={item.value}
              icon={<NavIcon icon={item.icon} label={item.label} />}
            >
              {item.label}
            </MenuBarItem>
          ))}
          {/* Excluded from the mobile bottom nav to keep it uncluttered */}
          <MenuBarItem
            value="logout"
            bottomNav={false}
            icon={<NavIcon icon="🚪" label="Sign out" />}
          >
            Sign out
          </MenuBarItem>
        </MenuBarSection>
      </MenuBar>

      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
