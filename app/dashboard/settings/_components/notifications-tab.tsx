"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Alert,
  Button,
  toast,
} from "@kwyw/kayv-glass-ui";
import type { Settings } from "@/lib/settings";
import { ToggleRow } from "./toggle-row";

type NotificationsTabProps = {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => void;
};

export function NotificationsTab({ settings, onSave }: NotificationsTabProps) {
  return (
    <Card variant="elevated">
      <CardHeader title="Notifications" description="Control your reminders" />
      <CardContent>
        <div className="space-y-3">
          <ToggleRow
            title="Daily morning reminder"
            description="Check in on your tasks each morning"
            checked={settings.dailyReminders}
            onChange={(dailyReminders) => onSave({ dailyReminders })}
          />
          <ToggleRow
            title="Weekly review prompt"
            description="Sunday evening summary of the week"
            checked={settings.weeklyReview}
            onChange={(weeklyReview) => onSave({ weeklyReview })}
          />
          <Alert variant="info" title="Browser notifications">
            Your choices are saved, but delivery needs a service worker that this app
            doesn&apos;t register yet — nothing will be sent for now.
          </Alert>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="primary"
          size="sm"
          onClick={() => toast({ title: "Notification preferences saved", variant: "success" })}
        >
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
