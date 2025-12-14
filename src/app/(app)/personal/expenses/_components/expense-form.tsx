"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Expense } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type ExpenseFormState = {
  vendor: string;
  category: string;
  amount: number | "";
  currency: string;
  date: string;
  taxAmount: number | "";
  projectLink: string;
  billable: boolean;
  notes: string;
  fxRate: number | "";
};

type Props = {
  mode: "create" | "edit";
  initialExpense?: Expense;
  onSaved?: (expense: Expense) => void;
};

const emptyForm: ExpenseFormState = {
  vendor: "",
  category: "",
  amount: "",
  currency: "EUR",
  date: new Date().toISOString().split("T")[0],
  taxAmount: "",
  projectLink: "",
  billable: false,
  notes: "",
  fxRate: "",
};

export function ExpenseForm({ mode, initialExpense, onSaved }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toNumeric = (value: unknown): number | "" => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : "";
    }
    if (typeof value === "object" && value !== null && "toNumber" in value) {
      const numeric = (value as { toNumber?: () => number }).toNumber?.();
      return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : "";
    }
    return "";
  };

  useEffect(() => {
    if (initialExpense) {
      setForm({
        vendor: initialExpense.vendor ?? "",
        category: initialExpense.category ?? "",
        amount: toNumeric(initialExpense.amount),
        currency: initialExpense.currency ?? "EUR",
        date: initialExpense.date ? new Date(initialExpense.date).toISOString().split("T")[0] : emptyForm.date,
        taxAmount: toNumeric(initialExpense.taxAmount),
        projectLink: initialExpense.projectLink ?? "",
        billable: initialExpense.billable ?? false,
        notes: initialExpense.notes ?? "",
        fxRate: toNumeric(initialExpense.fxRate),
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialExpense]);

  const derivedVatRates = useMemo(() => [19, 7, 0], []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      vendor: form.vendor,
      category: form.category,
      amount: typeof form.amount === "string" ? parseFloat(form.amount) : form.amount,
      currency: form.currency,
      date: form.date,
      taxAmount: form.taxAmount === "" ? undefined : typeof form.taxAmount === "string" ? parseFloat(form.taxAmount) : form.taxAmount,
      projectLink: form.projectLink || undefined,
      billable: form.billable,
      notes: form.notes || undefined,
      fxRate: form.fxRate === "" ? undefined : typeof form.fxRate === "string" ? parseFloat(form.fxRate) : form.fxRate,
    };

    if (!payload.vendor || !payload.category || !payload.amount || Number.isNaN(payload.amount)) {
      setError("Vendor, category, and amount are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(mode === "create" ? "/api/expenses" : `/api/expenses/${initialExpense?.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save expense");
      }

      const expense = (await res.json()) as Expense;
      setSuccess(mode === "create" ? "Expense created" : "Expense updated");
      onSaved?.(expense);

      if (mode === "create") {
        router.push("/personal/expenses");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save expense";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Expenses</p>
          <h1 className="text-3xl font-bold text-ink-900">{mode === "create" ? "New Expense" : "Update Expense"}</h1>
        </div>
        <Button type="submit" form="expense-form" disabled={loading} className="px-6">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-ink-900">Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form id="expense-form" className="grid gap-8 lg:grid-cols-[1.1fr_minmax(280px,0.9fr)]" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Select or type a category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor / Description</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g. Internet subscription"
                    value={form.vendor}
                    onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Invoice date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Repeat</Label>
                    <Input value="Does not repeat" disabled className="bg-slate-50 text-slate-500" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Total amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          amount: e.target.value === "" ? "" : parseFloat(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={form.currency}
                      onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="grid gap-2">
                    <Label htmlFor="projectLink">Project</Label>
                    <Input
                      id="projectLink"
                      placeholder="Optional project name or URL"
                      value={form.projectLink}
                      onChange={(e) => setForm((p) => ({ ...p, projectLink: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxAmount">Tax amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      value={form.taxAmount}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          taxAmount: e.target.value === "" ? "" : parseFloat(e.target.value),
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      {derivedVatRates.map((vat) => (
                        <button
                          key={vat}
                          type="button"
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs",
                            form.amount && form.taxAmount === Math.round(((Number(form.amount) * vat) / 100 + Number.EPSILON) * 100) / 100
                              ? "border-primary-500 text-primary-700 bg-primary-50"
                              : "border-slate-200 text-slate-700"
                          )}
                          onClick={() => {
                            if (!form.amount) return;
                            const tax = Math.round(((Number(form.amount) * vat) / 100 + Number.EPSILON) * 100) / 100;
                            setForm((p) => ({ ...p, taxAmount: tax }));
                          }}
                        >
                          {vat}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="grid gap-2">
                    <Label htmlFor="fxRate">FX rate (to base)</Label>
                    <Input
                      id="fxRate"
                      type="number"
                      step="0.000001"
                      value={form.fxRate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          fxRate: e.target.value === "" ? "" : parseFloat(e.target.value),
                        }))
                      }
                      placeholder="Optional conversion"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="billable"
                      checked={form.billable}
                      onCheckedChange={(checked) => setForm((p) => ({ ...p, billable: checked }))}
                    />
                    <Label htmlFor="billable">Billable to client</Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional note for this expense"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                {success && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-ink-900">Upload receipt (optional)</p>
                <p className="text-sm text-slate-600">Attach a receipt to keep documents organized. Max 5MB, PDF or image.</p>
              </div>
              <Button variant="outline" type="button" disabled>
                Upload file
              </Button>
              {form.taxAmount && form.amount ? (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  Estimated VAT:{" "}
                  <span className="font-semibold">
                    {formatCurrency(
                      typeof form.taxAmount === "string" ? Number(form.taxAmount) : form.taxAmount,
                      form.currency
                    )}
                  </span>
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
