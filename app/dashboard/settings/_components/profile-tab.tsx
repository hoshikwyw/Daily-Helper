"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  toast,
} from "@kwyw/kayv-glass-ui";
import { TIMEZONES, type Settings } from "@/lib/settings";
import { AccountCard } from "./account-card";

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
    <div className="space-y-6">
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
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Profile
          </Button>
        </CardFooter>
      </Card>

      {/* The Supabase connection details moved to About; an ordinary user
          has no use for the project URL, but everyone needs to change the
          password the admin handed them. */}
      <AccountCard />
    </div>
  );
}
