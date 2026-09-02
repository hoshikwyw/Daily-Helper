"use client";

import { Card, CardHeader, CardContent, useTheme, themes } from "@kwyw/kayv-glass-ui";
import type { ThemeName } from "@kwyw/kayv-glass-ui";
import type { Settings } from "@/lib/settings";
import { FormLabel } from "@/components/ui/label";
import { ToggleRow } from "./toggle-row";

type AppearanceTabProps = {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => void;
};

export function AppearanceTab({ settings, onSave }: AppearanceTabProps) {
  // Theme is owned by the library's provider, which persists it separately.
  const { theme, setTheme } = useTheme();

  return (
    <Card variant="elevated">
      <CardHeader title="Appearance" description="Customize your theme" />
      <CardContent>
        <div className="space-y-4">
          <div>
            <FormLabel mb="3">Theme</FormLabel>
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

          <ToggleRow
            title="Compact mode"
            description="Reduce spacing in lists and cards"
            checked={settings.compactMode}
            onChange={(compactMode) => onSave({ compactMode })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
