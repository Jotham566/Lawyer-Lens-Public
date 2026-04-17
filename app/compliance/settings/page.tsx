"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APIError } from "@/lib/api/client";
import { complianceApi } from "@/lib/api/compliance";

// =============================================================================
// Constants
// =============================================================================

const SECTORS = [
  "Financial Services",
  "Technology",
  "Manufacturing",
  "Agriculture",
  "Healthcare",
  "Energy",
  "Mining",
  "Real Estate",
  "Telecommunications",
  "Transportation",
  "Education",
  "Retail",
  "Hospitality",
];

const JURISDICTIONS = [
  { code: "UG", label: "Uganda" },
  { code: "KE", label: "Kenya" },
  { code: "TZ", label: "Tanzania" },
  { code: "RW", label: "Rwanda" },
  { code: "SS", label: "South Sudan" },
  { code: "CD", label: "DRC" },
];

const RISK_APPETITES = [
  { value: "conservative", label: "Conservative", description: "Low tolerance for regulatory risk" },
  { value: "moderate", label: "Moderate", description: "Balanced approach to compliance risk" },
  { value: "aggressive", label: "Aggressive", description: "Higher tolerance, faster-moving" },
];

const REGULATORS = [
  { code: "BoU", label: "Bank of Uganda (BoU)" },
  { code: "URA", label: "Uganda Revenue Authority (URA)" },
  { code: "CMA", label: "Capital Markets Authority (CMA)" },
  { code: "IRA", label: "Insurance Regulatory Authority (IRA)" },
  { code: "UCC", label: "Uganda Communications Commission (UCC)" },
  { code: "NDA", label: "National Drug Authority (NDA)" },
  { code: "ERA", label: "Electricity Regulatory Authority (ERA)" },
  { code: "NEMA", label: "National Environment Management Authority (NEMA)" },
  { code: "URSB", label: "Uganda Registration Services Bureau (URSB)" },
  { code: "FIA", label: "Financial Intelligence Authority (FIA)" },
];

const ACTIVITY_SUGGESTIONS = [
  "lending",
  "insurance",
  "securities trading",
  "mobile money",
  "digital services",
  "manufacturing",
  "import/export",
  "real estate development",
  "construction",
  "mining operations",
];

const ALERT_CHANNEL_OPTIONS = {
  critical: [
    { value: "email_immediate", label: "Email immediately" },
    { value: "in_app", label: "In-app only" },
    { value: "both", label: "Both" },
  ],
  high: [
    { value: "email_batch", label: "Email batch (hourly)" },
    { value: "digest", label: "Daily digest" },
    { value: "in_app", label: "In-app only" },
  ],
  medium: [
    { value: "digest", label: "Daily digest" },
    { value: "weekly_digest", label: "Weekly digest" },
    { value: "in_app", label: "In-app only" },
  ],
  low: [
    { value: "weekly_digest", label: "Weekly digest" },
    { value: "in_app", label: "In-app only" },
    { value: "disabled", label: "Disabled" },
  ],
};

const DIGEST_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const DIGEST_DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

const DIGEST_SECTIONS = [
  { key: "regulatory_events", label: "Regulatory Events" },
  { key: "findings", label: "Findings" },
  { key: "obligations_due", label: "Obligations Due" },
  { key: "task_summary", label: "Task Summary" },
];

// =============================================================================
// Helper: Feature-gated check (reuse from compliance dashboard)
// =============================================================================
function isFeatureGated(error: unknown): boolean {
  return error instanceof APIError && error.isFeatureGatingError();
}

// =============================================================================
// Page Component
// =============================================================================

export default function ComplianceSettingsPage() {
  const { canShowContent } = useRequireAuth();
  const queryClient = useQueryClient();

  // ── Load profile ──
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["compliance-profile"],
    queryFn: () => complianceApi.getProfile(),
    staleTime: 60_000,
    retry: false,
  });

  // Derive initial values from profile (no useEffect + setState)
  const profileDefaults = useMemo(() => {
    if (!profile) return null;
    const ap = (profile.alert_preferences ?? {}) as Record<string, unknown>;
    const dp = (profile.digest_preferences ?? {}) as Record<string, unknown>;
    return {
      sectors: profile.sectors ?? [],
      jurisdictions: profile.operating_jurisdictions ?? ["UG"],
      riskAppetite: profile.risk_appetite ?? "moderate",
      regulators: profile.regulators ?? [],
      activities: profile.business_activities ?? [],
      alertPrefs: {
        critical_channel: String(ap.critical_channel ?? "email_immediate"),
        high_channel: String(ap.high_channel ?? "email_batch"),
        medium_channel: String(ap.medium_channel ?? "digest"),
        low_channel: String(ap.low_channel ?? "digest"),
      },
      quietHoursEnabled: Boolean(ap.quiet_hours_enabled),
      quietHoursStart: String(ap.quiet_hours_start ?? "22:00"),
      quietHoursEnd: String(ap.quiet_hours_end ?? "06:00"),
      digestFrequency: String(dp.frequency ?? "weekly"),
      digestDay: String(dp.day_of_week ?? "monday"),
      digestSections: Array.isArray(dp.include_sections)
        ? (dp.include_sections as string[])
        : ["regulatory_events", "findings", "obligations_due", "task_summary"],
    };
  }, [profile]);

  // ── Form state — initialized from profile defaults ──
  const [sectors, setSectors] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>(["UG"]);
  const [riskAppetite, setRiskAppetite] = useState("moderate");
  const [regulators, setRegulators] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState("");
  const [alertPrefs, setAlertPrefs] = useState<Record<string, string>>({
    critical_channel: "email_immediate",
    high_channel: "email_batch",
    medium_channel: "digest",
    low_channel: "digest",
  });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("06:00");
  const [digestFrequency, setDigestFrequency] = useState("weekly");
  const [digestDay, setDigestDay] = useState("monday");
  const [digestSections, setDigestSections] = useState<string[]>([
    "regulatory_events", "findings", "obligations_due", "task_summary",
  ]);

  // Hydrate form from profile (use ref to run once)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (profileDefaults && !hydratedRef.current) {
      hydratedRef.current = true;
      // Use a microtask to batch all updates
      queueMicrotask(() => {
        setSectors(profileDefaults.sectors);
        setJurisdictions(profileDefaults.jurisdictions);
        setRiskAppetite(profileDefaults.riskAppetite);
        setRegulators(profileDefaults.regulators);
        setActivities(profileDefaults.activities);
        setAlertPrefs(profileDefaults.alertPrefs);
        setQuietHoursEnabled(profileDefaults.quietHoursEnabled);
        setQuietHoursStart(profileDefaults.quietHoursStart);
        setQuietHoursEnd(profileDefaults.quietHoursEnd);
        setDigestFrequency(profileDefaults.digestFrequency);
        setDigestDay(profileDefaults.digestDay);
        setDigestSections(profileDefaults.digestSections);
      });
    }
  }, [profileDefaults]);

  // UI state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: () =>
      complianceApi.updateProfile({
        sectors,
        regulators,
        operating_jurisdictions: jurisdictions,
        risk_appetite: riskAppetite,
        business_activities: activities,
        alert_preferences: {
          ...alertPrefs,
          quiet_hours_enabled: quietHoursEnabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        },
        digest_preferences: {
          frequency: digestFrequency,
          day_of_week: digestDay,
          include_sections: digestSections,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-profile"] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err) => {
      setSaveError(
        err instanceof APIError
          ? err.getUserMessage("Failed to save profile")
          : "Failed to save profile. Please try again."
      );
      setSaveSuccess(false);
    },
  });

  // ── Activity tag handlers ──
  const addActivity = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase();
      if (trimmed && !activities.includes(trimmed)) {
        setActivities((prev) => [...prev, trimmed]);
      }
      setActivityInput("");
    },
    [activities]
  );

  const removeActivity = useCallback((value: string) => {
    setActivities((prev) => prev.filter((a) => a !== value));
  }, []);

  const handleActivityKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addActivity(activityInput);
      }
    },
    [activityInput, addActivity]
  );

  // ── Toggle helpers ──
  const toggleItem = useCallback(
    (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
      setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
    },
    []
  );

  if (!canShowContent) return <PageLoading />;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && isFeatureGated(error)) {
    return (
      <div className="px-6 py-12 text-center lg:px-10">
        <Settings className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-xl font-bold">Enterprise Feature</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compliance profile settings require an Enterprise plan.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 lg:px-10">
        <Link
          href="/compliance"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Compliance Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
              <Settings className="h-6 w-6 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Compliance Profile Settings
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure your organization&apos;s compliance monitoring preferences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors",
              saveMutation.isPending
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>

        {/* Success / Error feedback */}
        {saveSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Profile settings saved successfully.
          </div>
        )}
        {saveError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-6 px-6 pb-12 lg:px-10">
        {/* ── Section 1: Organization Profile ── */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">Organization Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define your organization&apos;s industry focus and operating context.
          </p>

          {/* Sectors */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Sectors</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select the industry sectors your organization operates in.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTORS.map((sector) => (
                <label
                  key={sector}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    sectors.includes(sector)
                      ? "border-brand-gold bg-brand-gold/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={sectors.includes(sector)}
                    onChange={() => toggleItem(sectors, setSectors, sector)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      sectors.includes(sector)
                        ? "border-brand-gold bg-brand-gold text-white"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {sectors.includes(sector) && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </span>
                  {sector}
                </label>
              ))}
            </div>
          </div>

          {/* Operating Jurisdictions */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Operating Jurisdictions</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select the countries where your organization operates.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {JURISDICTIONS.map((j) => (
                <label
                  key={j.code}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    jurisdictions.includes(j.code)
                      ? "border-brand-gold bg-brand-gold/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={jurisdictions.includes(j.code)}
                    onChange={() => toggleItem(jurisdictions, setJurisdictions, j.code)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      jurisdictions.includes(j.code)
                        ? "border-brand-gold bg-brand-gold text-white"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {jurisdictions.includes(j.code) && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </span>
                  {j.code} ({j.label})
                </label>
              ))}
            </div>
          </div>

          {/* Risk Appetite */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Risk Appetite</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Set your organization&apos;s overall regulatory risk tolerance.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {RISK_APPETITES.map((ra) => (
                <label
                  key={ra.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-lg border px-4 py-3 transition-colors",
                    riskAppetite === ra.value
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="risk_appetite"
                      value={ra.value}
                      checked={riskAppetite === ra.value}
                      onChange={() => setRiskAppetite(ra.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-semibold">{ra.label}</span>
                  </div>
                  <span className="mt-0.5 pl-6 text-xs text-muted-foreground">
                    {ra.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: Applicable Regulators ── */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">Applicable Regulators</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the regulatory bodies that oversee your organization.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {REGULATORS.map((reg) => (
              <label
                key={reg.code}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                  regulators.includes(reg.code)
                    ? "border-brand-gold bg-brand-gold/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <input
                  type="checkbox"
                  checked={regulators.includes(reg.code)}
                  onChange={() => toggleItem(regulators, setRegulators, reg.code)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    regulators.includes(reg.code)
                      ? "border-brand-gold bg-brand-gold text-white"
                      : "border-muted-foreground/30"
                  )}
                >
                  {regulators.includes(reg.code) && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                </span>
                {reg.label}
              </label>
            ))}
          </div>
        </section>

        {/* ── Section 3: Business Activities ── */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">Business Activities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe your organization&apos;s core business activities. Type and
            press Enter to add.
          </p>

          {/* Tags display */}
          <div className="mt-4 flex flex-wrap gap-2">
            {activities.map((activity) => (
              <span
                key={activity}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-sm"
              >
                {activity}
                <button
                  type="button"
                  onClick={() => removeActivity(activity)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-brand-gold/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              onKeyDown={handleActivityKeyDown}
              placeholder="Type an activity and press Enter..."
              className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => addActivity(activityInput)}
              disabled={!activityInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Suggestions */}
          {ACTIVITY_SUGGESTIONS.filter((s) => !activities.includes(s)).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ACTIVITY_SUGGESTIONS.filter((s) => !activities.includes(s)).map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addActivity(suggestion)}
                      className="rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-gold hover:text-foreground"
                    >
                      + {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 4: Alert Preferences ── */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">Alert Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure how you receive compliance alerts by severity level.
          </p>

          <div className="mt-4 space-y-4">
            {(
              Object.entries(ALERT_CHANNEL_OPTIONS) as [
                string,
                { value: string; label: string }[],
              ][]
            ).map(([level, options]) => (
              <div key={level} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 text-sm font-semibold capitalize">{level} alerts</span>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        alertPrefs[`${level}_channel`] === opt.value
                          ? "border-primary bg-primary/5 text-primary dark:text-blue-300"
                          : "border-border/60 text-muted-foreground hover:border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name={`alert_${level}`}
                        value={opt.value}
                        checked={alertPrefs[`${level}_channel`] === opt.value}
                        onChange={() =>
                          setAlertPrefs((prev) => ({
                            ...prev,
                            [`${level}_channel`]: opt.value,
                          }))
                        }
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Quiet Hours */}
            <div className="mt-2 border-t border-border/40 pt-4">
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-semibold">Quiet Hours</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  Suppress non-critical alerts during off-hours
                </span>
              </div>
              {quietHoursEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 5: Digest Preferences ── */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight">Digest Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your compliance digest email schedule and contents.
          </p>

          <div className="mt-4 space-y-4">
            {/* Frequency */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-28 text-sm font-semibold">Frequency</span>
              <div className="flex flex-wrap gap-2">
                {DIGEST_FREQUENCIES.map((freq) => (
                  <label
                    key={freq.value}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      digestFrequency === freq.value
                        ? "border-primary bg-primary/5 text-primary dark:text-blue-300"
                        : "border-border/60 text-muted-foreground hover:border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="digest_frequency"
                      value={freq.value}
                      checked={digestFrequency === freq.value}
                      onChange={() => setDigestFrequency(freq.value)}
                      className="sr-only"
                    />
                    {freq.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Day (for weekly+) */}
            {(digestFrequency === "weekly" || digestFrequency === "biweekly") && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 text-sm font-semibold">Delivery day</span>
                <select
                  value={digestDay}
                  onChange={(e) => setDigestDay(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {DIGEST_DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Include Sections */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <span className="w-28 shrink-0 pt-0.5 text-sm font-semibold">
                Include sections
              </span>
              <div className="flex flex-wrap gap-2">
                {DIGEST_SECTIONS.map((section) => (
                  <label
                    key={section.key}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      digestSections.includes(section.key)
                        ? "border-brand-gold bg-brand-gold/10 text-foreground"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={digestSections.includes(section.key)}
                      onChange={() => toggleItem(digestSections, setDigestSections, section.key)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        digestSections.includes(section.key)
                          ? "border-brand-gold bg-brand-gold text-white"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {digestSections.includes(section.key) && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                    </span>
                    {section.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors",
              saveMutation.isPending
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
