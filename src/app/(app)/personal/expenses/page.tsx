"use client";

import { useEffect, useMemo, useState } from "react";
import { Expense } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type ExpenseForm = {
  vendor: string;
  category: string;
  amount: number | "";
  currency: string;
  date: string;
  taxAmount?: number | "";
  projectLink?: string;
  billable: boolean;
  notes?: string;
  fxRate?: number | "";
};

type Filters = {
  category?: string;
  project?: string;
  from?: string;
  to?: string;
};

const defaultForm: ExpenseForm = {
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

export default function ExpensesPage() {
  const [form, setForm] = useState<ExpenseForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({});
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set);
  }, [expenses]);

  const projectLinks = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => e.projectLink && set.add(e.projectLink));
    return Array.from(set);
  }, [expenses]);

  const fetchExpenses = async (nextFilters = filters) => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (nextFilters.category) params.set("category", nextFilters.category);
      if (nextFilters.project) params.set("project", nextFilters.project);
      if (nextFilters.from) params.set("from", nextFilters.from);
      if (nextFilters.to) params.set("to", nextFilters.to);
      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = (await res.json()) as Expense[];
      setExpenses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load expenses";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: form.vendor,
          category: form.category,
          amount: typeof form.amount === "string" ? parseFloat(form.amount) : form.amount,
          currency: form.currency,
          date: form.date,
          taxAmount:
            form.taxAmount === "" ? undefined : typeof form.taxAmount === "string" ? parseFloat(form.taxAmount) : form.taxAmount,
          projectLink: form.projectLink || undefined,
          billable: form.billable,
          notes: form.notes,
          fxRate: form.fxRate === "" ? undefined : typeof form.fxRate === "string" ? parseFloat(form.fxRate) : form.fxRate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create expense");
      }
      setSaveSuccess("Expense saved");
      setForm(defaultForm);
      fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create expense";
      setSaveError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = useMemo(() => expenses, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">Log costs to track profitability and deductions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchExpenses()} disabled={listLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", listLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-ink-900">New expense</CardTitle>
            <CardDescription>Add vendor, amount, tax, and mark billable if needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={form.vendor}
                    onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
                    required
                    placeholder="AWS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    required
                    placeholder="Cloud services"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxAmount">Tax amount (optional)</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    value={form.taxAmount ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, taxAmount: e.target.value === "" ? "" : parseFloat(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fxRate">FX rate (optional)</Label>
                  <Input
                    id="fxRate"
                    type="number"
                    step="0.000001"
                    value={form.fxRate ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, fxRate: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                    placeholder="Base currency conversion"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectLink">Project link (optional)</Label>
                  <Input
                    id="projectLink"
                    value={form.projectLink ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, projectLink: e.target.value }))}
                    placeholder="project-id or URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={form.notes ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional note"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="billable"
                  checked={form.billable}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, billable: checked }))}
                />
                <Label htmlFor="billable">Billable to client</Label>
              </div>

              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {saveSuccess}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save expense
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-ink-900">Expenses</CardTitle>
            <CardDescription>Filter by category, project, and date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={filters.category ?? ""}
                  onChange={(e) => {
                    const next = { ...filters, category: e.target.value || undefined };
                    setFilters(next);
                    fetchExpenses(next);
                  }}
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={filters.project ?? ""}
                  onChange={(e) => {
                    const next = { ...filters, project: e.target.value || undefined };
                    setFilters(next);
                    fetchExpenses(next);
                  }}
                >
                  <option value="">All</option>
                  {projectLinks.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>From</Label>
                <Input
                  type="date"
                  value={filters.from ?? ""}
                  onChange={(e) => {
                    const next = { ...filters, from: e.target.value || undefined };
                    setFilters(next);
                    fetchExpenses(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>To</Label>
                <Input
                  type="date"
                  value={filters.to ?? ""}
                  onChange={(e) => {
                    const next = { ...filters, to: e.target.value || undefined };
                    setFilters(next);
                    fetchExpenses(next);
                  }}
                />
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading expenses…
              </div>
            ) : listError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {listError}
              </div>
            ) : filteredList.length === 0 ? (
              <p className="text-sm text-slate-600">No expenses found.</p>
            ) : (
              <div className="space-y-3">
                {filteredList.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">{exp.vendor}</span>
                        <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-xs text-slate-700">
                          {exp.category}
                        </span>
                        {exp.billable && (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                            Billable
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink-900">
                        {formatCurrency(exp.amount.toNumber ? exp.amount.toNumber() : exp.amount, exp.currency)}
                        {exp.fxRate && exp.currency !== exp.baseCurrency
                          ? ` · ${formatCurrency(
                              exp.baseAmount.toNumber ? exp.baseAmount.toNumber() : exp.baseAmount,
                              exp.baseCurrency
                            )} @ ${exp.fxRate}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                      {exp.projectLink && (
                        <>
                          <span>&middot;</span>
                          <span>{exp.projectLink}</span>
                        </>
                      )}
                      {exp.taxAmount && (
                        <>
                          <span>&middot;</span>
                          <span>Tax {exp.taxAmount}</span>
                        </>
                      )}
                    </div>
                    {exp.notes && <p className="text-xs text-slate-600">{exp.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
