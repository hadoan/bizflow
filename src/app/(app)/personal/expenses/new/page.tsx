"use client";

import { ExpenseForm } from "../_components/expense-form";

export default function NewExpensePage() {
  return (
    <div className="max-w-5xl">
      <ExpenseForm mode="create" />
    </div>
  );
}
