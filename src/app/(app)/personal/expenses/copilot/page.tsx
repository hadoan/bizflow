"use client";

import { useEffect, useState } from "react";
import { ExpenseCopilot } from "../_components/expense-copilot";
import { useRouter } from "next/navigation";

export default function ExpenseCopilotPage() {
  const router = useRouter();
  const [expenseSaved, setExpenseSaved] = useState(false);

  useEffect(() => {
    if (expenseSaved) {
      // Show success message briefly then navigate
      const timer = setTimeout(() => {
        router.push("/personal/expenses");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [expenseSaved, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Assistant</h1>
          <p className="mt-2 text-gray-600">
            Chat with AI to create expenses from receipts or manual entry
          </p>
        </div>
      </div>

      {expenseSaved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Expense saved! Redirecting to expenses list...
        </div>
      )}

      <ExpenseCopilot
        onExpenseSaved={() => {
          setExpenseSaved(true);
        }}
      />
    </div>
  );
}
