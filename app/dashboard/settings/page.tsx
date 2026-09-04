"use client";

import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@kwyw/kayv-glass-ui";
import { useSettings } from "@/hooks/use-settings";
import type { Settings } from "@/lib/settings";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileTab } from "./_components/profile-tab";
import { AppearanceTab } from "./_components/appearance-tab";
import { NotificationsTab } from "./_components/notifications-tab";
import { AboutTab } from "./_components/about-tab";

export default function SettingsPage() {
  const { settings, save, loaded } = useSettings();

  function patch(changes: Partial<Settings>) {
    save({ ...settings, ...changes });
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Settings" }]}
        title="Settings"
        subtitle="Manage your preferences and account."
      />

      <div className="relative max-w-2xl space-y-6">
        {/* Tabs mount only once preferences are read, so each form seeds its
            own state from the stored values rather than from the defaults. */}
        {!loaded ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <Tabs defaultValue="profile">
            <TabList className="scroll-x">
              <Tab value="profile">Profile</Tab>
              <Tab value="appearance">Appearance</Tab>
              <Tab value="notifications">Notifications</Tab>
              <Tab value="about">About</Tab>
            </TabList>

            <TabPanels className="mt-4">
              <TabPanel value="profile">
                <ProfileTab settings={settings} onSave={patch} />
              </TabPanel>
              <TabPanel value="appearance">
                <AppearanceTab settings={settings} onSave={patch} />
              </TabPanel>
              <TabPanel value="notifications">
                <NotificationsTab settings={settings} onSave={patch} />
              </TabPanel>
              <TabPanel value="about">
                <AboutTab />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
}
