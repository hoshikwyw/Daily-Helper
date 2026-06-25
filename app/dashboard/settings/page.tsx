"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Input,
  Select,
  Checkbox,
  Button,
  Alert,
  Badge,
  Breadcrumb,
  GridPattern,
  GradientBackground,
  toast,
  useTheme,
  themes,
} from "@kwyw/kayv-glass-ui";
import type { ThemeName } from "@kwyw/kayv-glass-ui";

const FAQ = [
  {
    q: "Where is my data stored?",
    a: "All your data is stored in your personal Supabase project. You own it completely.",
  },
  {
    q: "Can I export my journal entries?",
    a: "Supabase provides a built-in export tool in the dashboard. You can also query via the API.",
  },
  {
    q: "How do I connect to Supabase?",
    a: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
  },
  {
    q: "Is this project open source?",
    a: "This is your personal dashboard — you control the code and data entirely.",
  },
];

const TIMEZONES = [
  { value: "UTC-8", label: "UTC-8 (PST)" },
  { value: "UTC-5", label: "UTC-5 (EST)" },
  { value: "UTC+0", label: "UTC+0 (GMT)" },
  { value: "UTC+1", label: "UTC+1 (CET)" },
  { value: "UTC+5:30", label: "UTC+5:30 (IST)" },
  { value: "UTC+8", label: "UTC+8 (SGT / HKT)" },
  { value: "UTC+9", label: "UTC+9 (JST)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("Kayv");
  const [timezone, setTimezone] = useState("UTC+8");
  const [dailyReminders, setDailyReminders] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  function handleSaveProfile() {
    toast({ title: "Profile saved", variant: "success" });
  }

  function handleSaveNotifications() {
    toast({ title: "Notification preferences saved", variant: "success" });
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[1,1],[4,3],[7,2]]}
      />

      <div className="relative">
        <Breadcrumb items={[{ label: "Today", href: "/dashboard" }, { label: "Settings" }]} />
      </div>

      <div className="relative">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your preferences and account.</p>
      </div>

      <div className="relative max-w-2xl space-y-6">
        <Tabs defaultValue="profile">
          <TabList>
            <Tab value="profile">Profile</Tab>
            <Tab value="appearance">Appearance</Tab>
            <Tab value="notifications">Notifications</Tab>
            <Tab value="about">About</Tab>
          </TabList>

          <TabPanels className="mt-4">
            {/* Profile */}
            <TabPanel value="profile">
              <Card variant="elevated">
                <CardHeader title="Profile" description="Your personal information" />
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Display name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                    <Select
                      label="Timezone"
                      value={timezone}
                      onChange={setTimezone}
                      options={TIMEZONES}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Supabase connection</label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                          <>
                            <Badge variant="success" dot size="sm">Connected</Badge>
                            <span className="text-slate-400 text-sm truncate">{process.env.NEXT_PUBLIC_SUPABASE_URL}</span>
                          </>
                        ) : (
                          <>
                            <Badge variant="warning" dot size="sm">Not configured</Badge>
                            <span className="text-slate-500 text-sm">Add .env.local to connect</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" size="sm" onClick={handleSaveProfile}>Save Profile</Button>
                </CardFooter>
              </Card>
            </TabPanel>

            {/* Appearance */}
            <TabPanel value="appearance">
              <Card variant="elevated">
                <CardHeader title="Appearance" description="Customize your theme" />
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                      <div className="grid grid-cols-3 gap-2">
                        {themes.map((t) => (
                          <button
                            key={t.name}
                            onClick={() => setTheme(t.name as ThemeName)}
                            className={`p-2.5 rounded-lg border text-sm font-medium transition-colors truncate ${
                              theme === t.name
                                ? "border-kv-500 bg-kv-500/10 text-kv-300"
                                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                            }`}
                          >
                            {t.name.replace("glass-", "")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Compact mode</p>
                        <p className="text-xs text-slate-500">Reduce spacing in lists and cards</p>
                      </div>
                      <Checkbox
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Notifications */}
            <TabPanel value="notifications">
              <Card variant="elevated">
                <CardHeader title="Notifications" description="Control your reminders" />
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Daily morning reminder</p>
                        <p className="text-xs text-slate-500">Check in on your tasks each morning</p>
                      </div>
                      <Checkbox
                        checked={dailyReminders}
                        onChange={(e) => setDailyReminders(e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Weekly review prompt</p>
                        <p className="text-xs text-slate-500">Sunday evening summary of the week</p>
                      </div>
                      <Checkbox
                        checked={weeklyReview}
                        onChange={(e) => setWeeklyReview(e.target.checked)}
                      />
                    </div>

                    <Alert variant="info" title="Browser notifications">
                      Notification support requires additional setup with a service worker.
                    </Alert>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" size="sm" onClick={handleSaveNotifications}>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabPanel>

            {/* About */}
            <TabPanel value="about">
              <Card variant="elevated">
                <CardHeader title="About Kayv" description="Your personal life management dashboard" />
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">✦ Kayv</span>
                      <Badge variant="primary" size="sm">Personal</Badge>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Built with Next.js, Tailwind CSS, @kwyw/kayv-glass-ui, and Supabase.
                      Your data stays in your own Supabase project.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">FAQ</p>
                    <Accordion>
                      {FAQ.map((item, i) => (
                        <AccordionItem key={i} value={String(i)}>
                          <AccordionTrigger>{item.q}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-slate-400 text-sm">{item.a}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}
