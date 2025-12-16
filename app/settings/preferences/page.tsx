"use client";

import { useState } from "react";
import { Bell, Moon, Sun, Monitor, Globe } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/components/providers";
import { PageHeader, AlertBanner, PageLoading } from "@/components/common";

// Local storage keys for preferences
const NOTIFICATION_PREFS_KEY = "user_notification_prefs";

interface NotificationPrefs {
  emailDigest: boolean;
  researchUpdates: boolean;
  productNews: boolean;
  securityAlerts: boolean;
}

const defaultNotificationPrefs: NotificationPrefs = {
  emailDigest: true,
  researchUpdates: true,
  productNews: false,
  securityAlerts: true,
};

function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaultNotificationPrefs;
  const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
  if (!stored) return defaultNotificationPrefs;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultNotificationPrefs;
  }
}

function saveNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

export default function PreferencesPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { theme, setTheme } = useTheme();

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(
    loadNotificationPrefs
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleNotificationChange = (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    saveNotificationPrefs(newPrefs);
    setSuccess("Preferences saved");
    setTimeout(() => setSuccess(null), 2000);
  };

  if (authLoading) {
    return <PageLoading message="Loading preferences..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferences"
        description="Customize your experience"
      />

      {success && (
        <AlertBanner
          variant="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how Law Lens looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive updates and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-digest">Weekly Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your research activity
              </p>
            </div>
            <Switch
              id="email-digest"
              checked={notificationPrefs.emailDigest}
              onCheckedChange={(checked) =>
                handleNotificationChange("emailDigest", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="research-updates">Research Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new cases are added to your areas of interest
              </p>
            </div>
            <Switch
              id="research-updates"
              checked={notificationPrefs.researchUpdates}
              onCheckedChange={(checked) =>
                handleNotificationChange("researchUpdates", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="product-news">Product News</Label>
              <p className="text-sm text-muted-foreground">
                Stay informed about new features and improvements
              </p>
            </div>
            <Switch
              id="product-news"
              checked={notificationPrefs.productNews}
              onCheckedChange={(checked) =>
                handleNotificationChange("productNews", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Important notifications about your account security
              </p>
            </div>
            <Switch
              id="security-alerts"
              checked={notificationPrefs.securityAlerts}
              onCheckedChange={(checked) =>
                handleNotificationChange("securityAlerts", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Language & Region</CardTitle>
          </div>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred language
              </p>
            </div>
            <Select defaultValue="en">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw" disabled>
                  Swahili (Coming soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Date Format</Label>
              <p className="text-sm text-muted-foreground">
                How dates are displayed
              </p>
            </div>
            <Select defaultValue="dmy">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
