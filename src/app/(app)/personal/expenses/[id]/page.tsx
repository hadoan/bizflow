"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Expense } from "@prisma/client";
import { ExpenseForm } from "../_components/expense-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/expenses/${params.id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to load expense");
        }
        const data = (await res.json()) as Expense;
        setExpense(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load expense";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading expense…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        <Button variant="outline" onClick={() => router.push("/personal/expenses")}>
          Back to expenses
        </Button>
      </div>
    );
  }

  if (!expense) return null;

  return (
    <div className="max-w-5xl">
      <ExpenseForm
        mode="edit"
        initialExpense={expense}
        onSaved={() => {
          router.push("/personal/expenses");
        }}
      />
    </div>
  );
}
