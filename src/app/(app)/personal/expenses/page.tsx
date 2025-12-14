"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Expense } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ReceiptAgent } from "./_components/receipt-agent";

type Filters = {
  category?: string;
  project?: string;
  from?: string;
  to?: string;
};

export default function ExpensesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({});
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAgent, setShowAgent] = useState(false);

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

  const filteredList = useMemo(() => expenses, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">Log costs to track profitability and deductions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchExpenses()} disabled={listLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", listLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant={showAgent ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAgent(!showAgent)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {showAgent ? "Hide" : "Scan"} Receipt
          </Button>
          <Button size="sm" onClick={() => router.push("/personal/expenses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New expense
          </Button>
        </div>
      </div>

      {showAgent && (
        <ReceiptAgent
          onExpenseSaved={() => {
            fetchExpenses();
            setShowAgent(false);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-ink-900">Expenses</CardTitle>
          <CardDescription>Click an expense to view details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm min-w-[160px]"
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm min-w-[160px]"
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
                className="min-w-[160px]"
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
                className="min-w-[160px]"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFilters({}); fetchExpenses({}); }}>
              Clear
            </Button>
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredList.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => router.push(`/personal/expenses/${exp.id}`)}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{exp.vendor}</span>
                      <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-xs text-slate-700">
                        {exp.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatCurrency(
                        typeof exp.amount === "object" && "toNumber" in exp.amount
                          ? exp.amount.toNumber()
                          : Number(exp.amount),
                        exp.currency
                      )}
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
                    {exp.billable && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-700">Billable</span>}
                  </div>
                  {exp.notes && <p className="text-xs text-slate-600 line-clamp-2">{exp.notes}</p>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
