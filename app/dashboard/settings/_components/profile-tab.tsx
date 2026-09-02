"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
  Select,
  toast,
} from "@kwyw/kayv-glass-ui";
import { TIMEZONES, type Settings } from "@/lib/settings";
import { FormLabel } from "@/components/ui/label";

type ProfileTabProps = {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => void;
};

export function ProfileTab({ settings, onSave }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [timezone, setTimezone] = useState(settings.timezone);

  function handleSave() {
    onSave({ displayName: displayName.trim(), timezone });
    toast({ title: "Profile saved", variant: "success" });
  }

  return (
    <Card variant="elevated">
      <CardHeader title="Profile" description="Your personal information" />
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          <Select
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONES}
          />
          <div>
            <FormLabel>Supabase connection</FormLabel>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <>
                  <Badge variant="success" dot size="sm">
                    Connected
                  </Badge>
                  <span className="text-slate-400 text-sm truncate">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL}
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="warning" dot size="sm">
                    Not configured
                  </Badge>
                  <span className="text-slate-500 text-sm">Add .env.local to connect</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
