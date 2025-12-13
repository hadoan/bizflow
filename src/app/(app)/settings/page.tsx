"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

type WorkspaceResponse = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: string;
  };
  gettingStarted: ChecklistItem[];
};

const currencyOptions = ["EUR", "USD", "GBP", "CHF", "CAD"];
const timezoneOptions = [
  "Europe/Berlin",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore",
];
const localeOptions = ["de-DE", "en-US", "en-GB", "fr-FR", "es-ES"];

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "",
    currency: "EUR",
    timezone: "Europe/Berlin",
    locale: "de-DE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkspaceResponse | null>(null);

  const sortedChecklist = useMemo(() => {
    if (!result?.gettingStarted) return [];
    return [...result.gettingStarted].sort((a, b) => {
      const orderA = (a.metadata as any)?.order ?? 0;
      const orderB = (b.metadata as any)?.order ?? 0;
      return orderA - orderB;
    });
  }, [result]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create workspace");
      }

      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create workspace";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-1 text-ink-900">Workspace</h1>
        <p className="mt-2 text-gray-600">
          Create a new workspace to manage clients, invoices, and tasks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-ink-900">Create workspace</CardTitle>
            <CardDescription>
              Workspace owner is assigned automatically. Currency locks after the first invoice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Freelancer Studio"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={form.currency}
                    onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Workspace currency is fixed after your first invoice.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    name="timezone"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={form.timezone}
                    onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  >
                    {timezoneOptions.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale / Language</Label>
                  <select
                    id="locale"
                    name="locale"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={form.locale}
                    onChange={(e) => setForm((prev) => ({ ...prev, locale: e.target.value }))}
                  >
                    {localeOptions.map((locale) => (
                      <option key={locale} value={locale}>
                        {locale}
                      </option>
                    ))}
                  </select>
                </div>

                {result?.workspace && (
                  <div className="space-y-2">
                    <Label>Workspace slug</Label>
                    <Input value={result.workspace.slug} readOnly />
                    <p className="text-xs text-slate-500">
                      Generated automatically for links and IDs.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create workspace
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg text-ink-900">Getting started</CardTitle>
              <CardDescription>
                Checklist appears after creation so you can hit the ground running.
              </CardDescription>
            </div>
            <div className="rounded-full bg-primary-50 p-2 text-primary-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-cloud-50 p-4 text-sm text-slate-600">
                Create your workspace to generate a personalized checklist.
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                  Workspace <span className="font-semibold">{result.workspace.name}</span> is ready.
                  You are the owner. Currency is set to {result.workspace.currency}.
                </div>
                <div className="space-y-2">
                  {sortedChecklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <CheckCircle2 className="mt-1 h-4 w-4 text-primary-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-ink-900">
                          {idx + 1}. {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-slate-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">Next up: Inbox</p>
                    <p className="text-xs text-slate-600">
                      Check off your tasks and get to your first invoice.
                    </p>
                  </div>
                  <Link
                    href="/personal/inbox"
                    className={cn(
                      "rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
                    )}
                  >
                    Open inbox
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
