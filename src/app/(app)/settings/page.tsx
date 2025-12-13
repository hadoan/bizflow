"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles, Upload, X } from "lucide-react";
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

type IdentityForm = {
  id?: string;
  legalName: string;
  tradeName?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  vatId?: string;
  taxNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  paymentInstructions?: string;
  isDefault: boolean;
  logoUrl?: string | null;
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
const allowedLogoTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

const emptyIdentity: IdentityForm = {
  legalName: "",
  tradeName: "",
  addressStreet: "",
  addressZip: "",
  addressCity: "",
  addressCountry: "",
  vatId: "",
  taxNumber: "",
  contactEmail: "",
  contactPhone: "",
  contactWebsite: "",
  paymentInstructions: "",
  isDefault: true,
  logoUrl: null,
};

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

  const [identityForm, setIdentityForm] = useState<IdentityForm>(emptyIdentity);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identitySuccess, setIdentitySuccess] = useState<string | null>(null);
  const [identityWarnings, setIdentityWarnings] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const res = await fetch("/api/business-identity");
        if (!res.ok) return;
        const identities = await res.json();
        const current = identities.find((i: any) => i.isDefault) ?? identities[0];
        if (current) {
          setIdentityForm({
            id: current.id,
            legalName: current.legalName,
            tradeName: current.tradeName ?? "",
            addressStreet: current.addressStreet ?? "",
            addressZip: current.addressZip ?? "",
            addressCity: current.addressCity ?? "",
            addressCountry: current.addressCountry ?? "",
            vatId: current.vatId ?? "",
            taxNumber: current.taxNumber ?? "",
            contactEmail: current.contactEmail ?? "",
            contactPhone: current.contactPhone ?? "",
            contactWebsite: current.contactWebsite ?? "",
            paymentInstructions: current.paymentInstructions ?? "",
            isDefault: current.isDefault,
            logoUrl: current.logoUrl ?? null,
          });
          setLogoPreview(current.logoUrl ?? null);
        }
      } catch {
        // silent
      }
    };
    loadIdentity();
  }, []);

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

  const handleIdentityChange = (field: keyof IdentityForm, value: string | boolean | null) => {
    setIdentityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      setIdentityForm((prev) => ({ ...prev, logoUrl: null }));
      return;
    }

    if (!allowedLogoTypes.includes(file.type)) {
      setIdentityError("Logo must be PNG, JPG, or SVG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setIdentityError("Logo file must be under 2MB");
      return;
    }

    setIdentityError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const saveIdentity = async () => {
    setIdentityLoading(true);
    setIdentityError(null);
    setIdentitySuccess(null);
    setIdentityWarnings([]);

    try {
      const formData = new FormData();
      if (identityForm.id) formData.append("id", identityForm.id);
      formData.append("legalName", identityForm.legalName);
      if (identityForm.tradeName) formData.append("tradeName", identityForm.tradeName);
      if (identityForm.addressStreet) formData.append("addressStreet", identityForm.addressStreet);
      if (identityForm.addressZip) formData.append("addressZip", identityForm.addressZip);
      if (identityForm.addressCity) formData.append("addressCity", identityForm.addressCity);
      if (identityForm.addressCountry) formData.append("addressCountry", identityForm.addressCountry);
      if (identityForm.vatId) formData.append("vatId", identityForm.vatId);
      if (identityForm.taxNumber) formData.append("taxNumber", identityForm.taxNumber);
      if (identityForm.contactEmail) formData.append("contactEmail", identityForm.contactEmail);
      if (identityForm.contactPhone) formData.append("contactPhone", identityForm.contactPhone);
      if (identityForm.contactWebsite) formData.append("contactWebsite", identityForm.contactWebsite);
      if (identityForm.paymentInstructions)
        formData.append("paymentInstructions", identityForm.paymentInstructions);
      formData.append("isDefault", identityForm.isDefault ? "true" : "false");

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (identityForm.logoUrl === null) {
        formData.append("logoUrl", "");
      }

      const res = await fetch("/api/business-identity", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save identity");
      }

      setIdentityForm({
        id: data.identity.id,
        legalName: data.identity.legalName,
        tradeName: data.identity.tradeName ?? "",
        addressStreet: data.identity.addressStreet ?? "",
        addressZip: data.identity.addressZip ?? "",
        addressCity: data.identity.addressCity ?? "",
        addressCountry: data.identity.addressCountry ?? "",
        vatId: data.identity.vatId ?? "",
        taxNumber: data.identity.taxNumber ?? "",
        contactEmail: data.identity.contactEmail ?? "",
        contactPhone: data.identity.contactPhone ?? "",
        contactWebsite: data.identity.contactWebsite ?? "",
        paymentInstructions: data.identity.paymentInstructions ?? "",
        isDefault: data.identity.isDefault,
        logoUrl: data.identity.logoUrl ?? null,
      });
      setLogoFile(null);
      setLogoPreview(data.identity.logoUrl ?? null);
      setIdentityWarnings(data.warnings ?? []);
      setIdentitySuccess("Business identity saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save identity";
      setIdentityError(message);
    } finally {
      setIdentityLoading(false);
    }
  };

  const previewAddress = [identityForm.addressStreet, identityForm.addressZip, identityForm.addressCity]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-10">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Business identity</h2>
            <p className="text-sm text-slate-600">
              Keep invoices compliant and on-brand. VAT format is soft-validated and saved even if it looks off.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-ink-900">Profile & branding</CardTitle>
              <CardDescription>Update identity, tax details, and payment instructions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal name</Label>
                  <Input
                    id="legalName"
                    value={identityForm.legalName}
                    onChange={(e) => handleIdentityChange("legalName", e.target.value)}
                    placeholder="ACME Consulting GmbH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Trading name</Label>
                  <Input
                    id="tradeName"
                    value={identityForm.tradeName ?? ""}
                    onChange={(e) => handleIdentityChange("tradeName", e.target.value)}
                    placeholder="ACME Studio (optional)"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressStreet">Street</Label>
                  <Input
                    id="addressStreet"
                    value={identityForm.addressStreet ?? ""}
                    onChange={(e) => handleIdentityChange("addressStreet", e.target.value)}
                    placeholder="Main Street 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="addressZip">ZIP</Label>
                    <Input
                      id="addressZip"
                      value={identityForm.addressZip ?? ""}
                      onChange={(e) => handleIdentityChange("addressZip", e.target.value)}
                      placeholder="10115"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressCity">City</Label>
                    <Input
                      id="addressCity"
                      value={identityForm.addressCity ?? ""}
                      onChange={(e) => handleIdentityChange("addressCity", e.target.value)}
                      placeholder="Berlin"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressCountry">Country</Label>
                  <Input
                    id="addressCountry"
                    value={identityForm.addressCountry ?? ""}
                    onChange={(e) => handleIdentityChange("addressCountry", e.target.value)}
                    placeholder="DE"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vatId">VAT ID</Label>
                    <Input
                      id="vatId"
                      value={identityForm.vatId ?? ""}
                      onChange={(e) => handleIdentityChange("vatId", e.target.value)}
                      placeholder="DE123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Tax number</Label>
                    <Input
                      id="taxNumber"
                      value={identityForm.taxNumber ?? ""}
                      onChange={(e) => handleIdentityChange("taxNumber", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input
                    id="contactEmail"
                    value={identityForm.contactEmail ?? ""}
                    onChange={(e) => handleIdentityChange("contactEmail", e.target.value)}
                    placeholder="contact@acme.example"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={identityForm.contactPhone ?? ""}
                    onChange={(e) => handleIdentityChange("contactPhone", e.target.value)}
                    placeholder="+49 30 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactWebsite">Website</Label>
                  <Input
                    id="contactWebsite"
                    value={identityForm.contactWebsite ?? ""}
                    onChange={(e) => handleIdentityChange("contactWebsite", e.target.value)}
                    placeholder="https://acme.example"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment instructions</Label>
                <Input
                  id="paymentInstructions"
                  value={identityForm.paymentInstructions ?? ""}
                  onChange={(e) => handleIdentityChange("paymentInstructions", e.target.value)}
                  placeholder="IBAN / SWIFT / bank info (optional)"
                />
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-cloud-50 flex items-center justify-center">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink-900">Logo</p>
                    <p className="text-xs text-slate-500">PNG, JPG, or SVG. Max 2MB.</p>
                    <div className="flex gap-2">
                      <label className="cursor-pointer text-xs font-semibold text-primary-700 hover:text-primary-800">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                          className="hidden"
                          onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                        />
                        Upload
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-600"
                          onClick={() => handleLogoChange(null)}
                        >
                          <X className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    checked={identityForm.isDefault}
                    onChange={(e) => handleIdentityChange("isDefault", e.target.checked)}
                  />
                  Set as default identity
                </label>
              </div>

              {identityWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {identityWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {identityError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {identityError}
                </div>
              )}

              {identitySuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {identitySuccess}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={saveIdentity} disabled={identityLoading || !identityForm.legalName}>
                  {identityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save identity
                </Button>
                <p className="text-xs text-slate-500">
                  VAT validation is soft; we save even if the format looks off.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-ink-900">Invoice preview</CardTitle>
              <CardDescription>Live view of how your identity appears on invoices/quotes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-ink-900">
                      {identityForm.tradeName || identityForm.legalName || "Your company name"}
                    </p>
                    <p className="text-sm text-slate-600">{identityForm.legalName}</p>
                    <p className="text-sm text-slate-600">
                      {previewAddress || "Street · ZIP · City"}
                    </p>
                    {identityForm.addressCountry && (
                      <p className="text-sm text-slate-600">{identityForm.addressCountry}</p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 bg-cloud-50 flex items-center justify-center">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">Logo</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-700">
                  <p>
                    Contact: {identityForm.contactEmail || "email@example.com"} ·{" "}
                    {identityForm.contactPhone || "+49 000 000"} ·{" "}
                    {identityForm.contactWebsite || "yourwebsite.com"}
                  </p>
                  <p>
                    VAT: {identityForm.vatId || "—"} · Tax number: {identityForm.taxNumber || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-cloud-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-ink-900 mb-1">Payment instructions</p>
                  <p className="whitespace-pre-line">
                    {identityForm.paymentInstructions || "Add IBAN / SWIFT / bank details here."}
                  </p>
                </div>

                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                  This is a static preview. Invoice numbers and line items appear here when creating an invoice.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
